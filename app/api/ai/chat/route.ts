import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/claude/client'
import { buildSystemPrompt } from '@/lib/claude/prompts'
import { selectModel, getModelName } from '@/lib/claude/router'
import { retrieveContext, storeMessage } from '@/lib/pinecone/queries'
import { searchKnowledge } from '@/lib/knowledge/queries'

export async function POST(request: Request) {
  try {
    const { message, conversationId, emotions } = await request.json()

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile for entry point and name
    const { data: profile } = await supabase
      .from('users')
      .select('entry_point, name')
      .eq('id', user.id)
      .single() as any

    let currentConversationId = conversationId

    // Create new conversation if none exists or if "new" is passed
    if (!currentConversationId || currentConversationId === 'new') {
      console.log('🆕 Creating new conversation (received:', conversationId, ')')
      
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          entry_point: profile?.entry_point || null,
          title: message.substring(0, 50), // Use first part of message as title
        } as any)
        .select()
        .single() as any

      if (convError) {
        console.error('Error creating conversation:', convError)
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        )
      }

      currentConversationId = newConversation.id
      console.log('✅ New conversation created with ID:', currentConversationId)
    }

    // Get conversation history (last 10 messages)
    console.log('Loading messages for conversation:', currentConversationId)
    
    const { data: history, error: historyError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: true })
      .limit(10) as any
    
    console.log('Loaded messages from DB:', history?.length || 0)
    if (historyError) {
      console.error('Error loading history:', historyError)
    }
    if (history && history.length > 0) {
      console.log('Previous messages:')
      history.forEach((msg: any, idx: number) => {
        console.log(`  ${idx + 1}. ${msg.role}: ${msg.content.substring(0, 80)}...`)
      })
    } else {
      console.log('No previous messages found in database')
    }

    // Store user message and get the ID
    const { data: userMessageData } = await supabase
      .from('messages')
      .insert({
        conversation_id: currentConversationId,
        user_id: user.id,
        role: 'user',
        content: message,
        input_type: 'text',
      } as any)
      .select('id')
      .single() as any

    const userMessageId = userMessageData?.id

    // Determine which model to use
    const modelContext = {
      messageCount: (history?.length || 0) + 1,
      hasPatternQuery: message.toLowerCase().includes('pattern') || message.toLowerCase().includes('notice'),
      isRecallQuery: message.toLowerCase().includes('remember') || message.toLowerCase().includes('said'),
      messageLength: message.length,
      conversationDepth: history?.length || 0,
    }

    const modelType = selectModel(modelContext)
    const modelName = getModelName(modelType)

    // Retrieve relevant context from Pinecone (RAG)
    let retrievedContext = ''
    try {
      const contextResults = await retrieveContext(user.id, message, supabase, 5)
      if (contextResults.length > 0) {
        retrievedContext = contextResults
          .map((ctx, idx) => 
            `[${idx + 1}] (${new Date(ctx.timestamp).toLocaleDateString()}) ${ctx.role === 'user' ? 'You said' : 'I said'}: "${ctx.content}"`
          )
          .join('\n\n')
        
        console.log('=== RAG CONTEXT RETRIEVED ===')
        console.log(`Found ${contextResults.length} relevant past messages`)
        console.log(retrievedContext)
        console.log('============================')
      }
    } catch (error) {
      console.error('Error retrieving context:', error)
      // Continue without context if retrieval fails
    }

    // Search knowledge base for expert content
    let knowledgeContext = ''
    try {
      const knowledgeResults = await searchKnowledge(message, profile?.entry_point, 2)
      if (knowledgeResults.length > 0) {
        knowledgeContext = knowledgeResults
          .map((k, idx) => {
            let entry = `[Expert Resource ${idx + 1}] ${k.title}\n${k.content}`
            
            // Add file URL if present
            if (k.file_url) {
              const fileTypeLabel = k.file_type === 'video' ? 'video' : 
                                     k.file_type === 'audio' ? 'audio' : 
                                     'document'
              entry += `\n\nℹ️ This knowledge comes from a ${fileTypeLabel}: ${k.file_url}`
              if (k.file_name) {
                entry += `\nFile: ${k.file_name}`
              }
            }
            
            return entry
          })
          .join('\n\n')
        
        console.log('=== KNOWLEDGE RETRIEVED ===')
        console.log(`Found ${knowledgeResults.length} relevant knowledge entries`)
        console.log('===========================')
      }
    } catch (error) {
      console.error('Error retrieving knowledge:', error)
      // Continue without knowledge if retrieval fails
    }

    // Build conversation history for Claude
    const messages = [
      ...(history || []).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: message,
      },
    ]
    
    console.log('=== CONVERSATION HISTORY ===')
    console.log(`Total messages being sent to Claude: ${messages.length}`)
    console.log('Message history:')
    messages.forEach((msg, idx) => {
      console.log(`  [${idx + 1}] ${msg.role}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`)
    })
    console.log('============================')

    // Format emotions for Claude if available
    let emotionContext = ''
    if (emotions && emotions.length > 0) {
      const emotionStrings = emotions
        .map((e: any) => `${e.name} (${(e.score * 100).toFixed(0)}%)`)
        .join(', ')
      emotionContext = `User's voice indicates: ${emotionStrings}`
      console.log('🎭 Emotion context:', emotionContext)
    }

    // Combine all context
    let combinedContext = retrievedContext
    if (knowledgeContext) {
      if (combinedContext) {
        combinedContext += '\n\n--- Expert Resources ---\n\n' + knowledgeContext
      } else {
        combinedContext = knowledgeContext
      }
    }

    // Get AI response from Claude with RAG context, knowledge, and emotions
    const systemPrompt = buildSystemPrompt(profile?.entry_point, combinedContext, profile?.name, emotionContext)
    
    // Debug logging
    console.log('=== PASSAGE DEBUG ===')
    console.log('User profile:', { entry_point: profile?.entry_point, name: profile?.name })
    console.log('System prompt:', systemPrompt)
    console.log('===================')

    const response = await anthropic.messages.create({
      model: modelName,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    })

    const aiMessage = response.content[0].type === 'text' 
      ? response.content[0].text 
      : ''

    // Store AI response and get the ID
    const { data: aiMessageData } = await supabase
      .from('messages')
      .insert({
        conversation_id: currentConversationId,
        user_id: user.id,
        role: 'assistant',
        content: aiMessage,
        tokens_used: response.usage.output_tokens,
        model_used: modelType,
      } as any)
      .select('id')
      .single() as any

    const aiMessageId = aiMessageData?.id

    // Store both messages in Pinecone (async, don't wait)
    if (userMessageId) {
      storeMessage(
        userMessageId,
        user.id,
        currentConversationId,
        message,
        'user',
        profile?.entry_point || 'other'
      ).catch(err => console.error('Error storing user message in Pinecone:', err))
    }

    if (aiMessageId) {
      storeMessage(
        aiMessageId,
        user.id,
        currentConversationId,
        aiMessage,
        'assistant',
        profile?.entry_point || 'other'
      ).catch(err => console.error('Error storing AI message in Pinecone:', err))
    }

    console.log('🎯 Returning response with conversationId:', currentConversationId)
    
    return NextResponse.json({
      message: aiMessage,
      conversationId: currentConversationId,
      modelUsed: modelType,
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
