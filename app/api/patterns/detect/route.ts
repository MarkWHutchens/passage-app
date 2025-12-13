import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  console.log('=== PATTERN DETECTION STARTED ===')
  
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('❌ No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    // Get all user messages from database
    const { data: messages } = await supabase
      .from('messages')
      .select('id, content, role, created_at, conversation_id')
      .eq('user_id', user.id)
      .eq('role', 'user') // Only analyze user messages
      .order('created_at', { ascending: false })
      .limit(100) as any // Last 100 user messages

    console.log(`📊 Found ${messages?.length || 0} user messages`)

    if (!messages || messages.length < 5) {
      console.log('❌ Not enough messages for analysis')
      return NextResponse.json({ 
        message: 'Not enough messages for pattern detection',
        patterns: []
      })
    }

    // Get user profile for context
    const { data: profile } = await supabase
      .from('users')
      .select('entry_point')
      .eq('id', user.id)
      .single() as any

    console.log('👤 User entry point:', profile?.entry_point)

    // Use Claude to analyze messages for patterns
    const messageTexts = messages.map((m: any) => m.content).join('\n---\n')
    
    console.log('📝 Sample messages being analyzed:')
    console.log(messageTexts.substring(0, 500) + '...')
    console.log(`Total message text length: ${messageTexts.length} characters`)
    
    console.log('🤖 Calling Claude API...')
      const response = await anthropic.messages.create({
      model: process.env.CLAUDE_HAIKU_MODEL || 'claude-3-5-haiku-20241022',
      max_tokens: 1500,
      system: `You are analyzing conversation messages to detect recurring patterns, themes, and insights. The user is navigating ${profile?.entry_point || 'a life transition'}.

Identify:
1. RECURRING THEMES - Topics mentioned multiple times
2. EMOTIONAL PATTERNS - Emotions that come up repeatedly  
3. TRIGGERS - Situations that consistently cause difficulty
4. PROGRESS - Signs of growth or positive change

For each pattern found, provide:
- type: 'recurring_theme', 'emotion', 'trigger', or 'progress'
- description: A brief, empathetic summary (1 sentence)
- evidence: Array of message excerpts that show this pattern
- count: How many times this appears

Format as JSON array. Limit to top 5 most significant patterns.`,
      messages: [{
        role: 'user',
        content: `Analyze these messages for patterns:\n\n${messageTexts}`
      }]
    })

    console.log('✅ Claude API response received')
    
    const content = response.content[0]
    if (content.type !== 'text') {
      console.log('❌ Unexpected response type:', content.type)
      throw new Error('Unexpected response type')
    }

    console.log('📄 Claude\'s full response:')
    console.log(content.text)
    console.log('=' .repeat(80))

    // Parse Claude's response
    let patterns: any[] = []
    try {
      // Extract JSON from response
      const jsonMatch = content.text.match(/\[[\s\S]*\]/)
      console.log('🔍 JSON match found:', !!jsonMatch)
      
      if (jsonMatch) {
        console.log('📋 Extracted JSON:', jsonMatch[0])
        patterns = JSON.parse(jsonMatch[0])
        console.log(`✅ Parsed ${patterns.length} patterns from response`)
      } else {
        console.log('❌ No JSON array found in Claude response')
      }
    } catch (parseError) {
      console.error('❌ Error parsing pattern response:', parseError)
      console.log('Raw text that failed to parse:', content.text)
      return NextResponse.json({ 
        message: 'Could not parse patterns',
        patterns: []
      })
    }

    console.log(`💾 Storing ${patterns.length} patterns in database...`)

    // Store patterns in database
    const storedPatterns = []
    for (const pattern of patterns) {
      console.log(`\n📌 Processing pattern: "${pattern.description}"`)
      console.log(`   Type: ${pattern.type}`)
      console.log(`   Count: ${pattern.count}`)
      console.log(`   Evidence items: ${pattern.evidence?.length || 0}`)
      
      // Find message IDs that match the evidence
      const evidenceIds = messages
        .filter((m: any) => pattern.evidence?.some((excerpt: string) => 
          m.content.toLowerCase().includes(excerpt.toLowerCase().slice(0, 30))
        ))
        .map((m: any) => m.id)
        .slice(0, 10)

      console.log(`   Found ${evidenceIds.length} matching message IDs`)

      const { data: existingPattern, error: searchError } = await supabase
        .from('patterns')
        .select('id, occurrence_count')
        .eq('user_id', user.id)
        .eq('description', pattern.description)
        .single() as any

      if (searchError && searchError.code !== 'PGRST116') {
        console.log('   ⚠️ Error checking for existing pattern:', searchError)
      }

      if (existingPattern) {
        console.log(`   ♻️  Updating existing pattern (ID: ${existingPattern.id})`)
        const { error: updateError } = await supabase
          .from('patterns')
          .update({
            occurrence_count: pattern.count || existingPattern.occurrence_count + 1,
            evidence_message_ids: evidenceIds,
            last_seen_at: new Date().toISOString(),
            is_active: true
          } as any)
          .eq('id', existingPattern.id)
        
        if (updateError) {
          console.log('   ❌ Error updating pattern:', updateError)
        } else {
          console.log('   ✅ Pattern updated successfully')
        }
        
        storedPatterns.push({ ...pattern, id: existingPattern.id })
      } else {
        console.log('   ➕ Creating new pattern')
        const { data: newPattern, error: insertError } = await supabase
          .from('patterns')
          .insert({
            user_id: user.id,
            pattern_type: pattern.type || 'recurring_theme',
            description: pattern.description,
            evidence_message_ids: evidenceIds,
            occurrence_count: pattern.count || 1,
            is_active: true
          } as any)
          .select()
          .single() as any

        if (insertError) {
          console.log('   ❌ Error inserting pattern:', insertError)
        } else if (newPattern) {
          console.log(`   ✅ Pattern created successfully (ID: ${newPattern.id})`)
          storedPatterns.push({ ...pattern, id: newPattern.id })
        } else {
          console.log('   ⚠️ No pattern returned after insert')
        }
      }
    }

    console.log(`\n🎉 Pattern detection complete! Stored ${storedPatterns.length} patterns`)
    console.log('=== PATTERN DETECTION FINISHED ===\n')

    return NextResponse.json({ 
      message: 'Patterns detected successfully',
      patterns: storedPatterns
    })
  } catch (error) {
    console.error('Error detecting patterns:', error)
    return NextResponse.json(
      { error: 'Failed to detect patterns' },
      { status: 500 }
    )
  }
}
