'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import VoiceRecorder from '@/components/VoiceRecorder'
import MessageTag from '@/components/MessageTag'
import { TagType } from '@/types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  tags?: Array<{ id: string; tag_type: TagType; custom_label?: string }>
}

interface Conversation {
  id: string
  created_at: string
  first_message?: string
  message_count: number
}

export default function TalkPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const conversationId = searchParams.get('id')
  
  // Use ref to track actual conversation ID across renders
  const conversationIdRef = useRef(conversationId)
  
  // List view state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingList, setLoadingList] = useState(true)
  
  // Chat view state
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null)
  const [isTextareaExpanded, setIsTextareaExpanded] = useState(false)
  const [entryPoint, setEntryPoint] = useState<string>('other')
  const [showEntryPointSelector, setShowEntryPointSelector] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const supabase = createClient()
  
  // Update ref when conversationId changes from URL
  useEffect(() => {
    conversationIdRef.current = conversationId
  }, [conversationId])

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId)
      loadUserProfile()
    } else {
      loadConversationList()
    }
    
    // Load voice preference from user profile or localStorage
    loadUserProfile()
  }, [conversationId])

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('users')
        .select('entry_point, voice_muted')
        .eq('id', user.id)
        .single() as any

      if (profile) {
        setEntryPoint(profile.entry_point || 'other')
        // Voice muted defaults to false (voice enabled by default)
        setVoiceEnabled(!profile.voice_muted)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  useEffect(() => {
    if (conversationId && messages.length > 0) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        scrollToBottom()
      })
    }
  }, [messages])

  const scrollToBottom = () => {
    // Scroll with smooth behavior and ensure the element is in view
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end',
      inline: 'nearest'
    })
  }

  const toggleVoice = async () => {
    const newValue = !voiceEnabled
    setVoiceEnabled(newValue)
    
    // Save to database
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('users')
        .update({ voice_muted: !newValue } as any)
        .eq('id', user.id)
    }
    
    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlayingMessageId(null)
    }
  }

  const handleEntryPointChange = async (newEntryPoint: string) => {
    setEntryPoint(newEntryPoint)
    setShowEntryPointSelector(false)
    
    // Save to database and update conversation
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('users')
        .update({ entry_point: newEntryPoint } as any)
        .eq('id', user.id)
      
      // Also update the current conversation if it exists
      if (conversationId && conversationId !== 'new') {
        await supabase
          .from('conversations')
          .update({ entry_point: newEntryPoint } as any)
          .eq('id', conversationId)
      }
    }
  }

  const getEntryPointLabel = (ep: string) => {
    const labels: Record<string, string> = {
      'burnout': 'Burnout',
      'grief': 'Grief & Loss',
      'divorce': 'Divorce/Separation',
      'addiction': 'Addiction Recovery',
      'career': 'Career Crisis',
      'illness': 'Illness Recovery',
      'transition': 'Life Transition',
      'other': 'General Support'
    }
    return labels[ep] || ep
  }

  const playMessage = async (messageId: string, text: string) => {
    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }

      setPlayingMessageId(messageId)
      console.log('🔊 Generating speech...')
      
      const response = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate speech')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      // Create and play audio
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      
      audio.onended = () => {
        setPlayingMessageId(null)
        URL.revokeObjectURL(audioUrl)
      }
      
      audio.onerror = () => {
        setPlayingMessageId(null)
        URL.revokeObjectURL(audioUrl)
        console.error('Error playing audio')
      }
      
      audio.onplay = () => {
        // Audio actually started playing
        setPlayingMessageId(messageId)
        console.log('▶️ Audio playing')
      }
      
      audio.onpause = () => {
        // Audio paused or stopped
        setPlayingMessageId(null)
      }
      
      // Try to play - if autoplay is blocked, clear playing state
      try {
        await audio.play()
        console.log('▶️ Playing audio (autoplay succeeded)')
      } catch (playError: any) {
        if (playError.name === 'NotAllowedError') {
          console.log('🚫 Autoplay blocked - play button available')
          setPlayingMessageId(null)
        } else {
          throw playError
        }
      }
    } catch (error) {
      console.error('Error with text-to-speech:', error)
      setPlayingMessageId(null)
      throw error
    }
  }

  const stopPlaying = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlayingMessageId(null)
    }
  }

  const loadConversationList = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get all conversations with message count
      const { data: convos } = await supabase
        .from('conversations')
        .select('id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) as any

      if (convos) {
        // Get first message for each conversation
        const conversationsWithPreviews = await Promise.all(
          convos.map(async (convo: any) => {
            const { data: msgs } = await supabase
              .from('messages')
              .select('content, role')
              .eq('conversation_id', convo.id)
              .eq('role', 'user')
              .order('created_at', { ascending: true })
              .limit(1) as any

            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', convo.id) as any

            return {
              ...convo,
              first_message: msgs?.[0]?.content || 'New conversation',
              message_count: count || 0
            }
          })
        )
        
        setConversations(conversationsWithPreviews)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoadingList(false)
    }
  }

  const loadConversation = async (convId: string) => {
    try {
      setLoadingHistory(true)
      const { data: msgs } = await supabase
        .from('messages')
        .select(`
          *,
          tags:memory_tags(id, tag_type, custom_label)
        `)
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true }) as any

      if (msgs) {
        setMessages(msgs)
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSend = async () => {
    if (!inputMessage.trim() || loading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setLoading(true)
    
    // Reset textarea height after sending
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    if (textarea) {
      textarea.style.height = '52px'
    }

    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempUserMsg])

    // Use the ref to get the most current conversation ID
    const currentConvoId = conversationIdRef.current
    console.log('📤 Sending message with conversationId:', currentConvoId)
    console.log('   URL param id:', searchParams.get('id'))

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: currentConvoId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      console.log('📥 Got response from API:', data.conversationId)
      console.log('   Current conversationIdRef:', conversationIdRef.current)

      // Add assistant message to state first
      const assistantMsg: Message = {
        id: `temp-ai-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMsg])

      // If this was a new conversation, update both URL and ref
      if (data.conversationId && (!conversationId || conversationId === 'new')) {
        console.log('🔄 Updating conversation ID from', conversationId, 'to', data.conversationId)
        // Update ref immediately so next message uses real ID
        conversationIdRef.current = data.conversationId
        // Update URL
        router.replace(`/talk?id=${data.conversationId}`, { scroll: false })
      }

      // Try to autoplay if voice mode is enabled
      if (voiceEnabled) {
        try {
          await playMessage(assistantMsg.id, data.message)
        } catch (error) {
          console.log('Autoplay blocked - play button available')
        }
      }

      // Note: We don't reload from database here to avoid screen flash.
      // Messages already have temp IDs and will work fine with the tag component.
      // Tags will reload messages when added via handleTagAdded().
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMsg.id))
      alert('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTranscriptReady = (transcript: string) => {
    setInputMessage(transcript)
    // Don't auto-send, let user review and edit
    // setTimeout(() => {
    //   handleSend()
    // }, 100)
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value)
    
    // Auto-resize textarea (don't resize if expanded)
    if (!isTextareaExpanded) {
      const textarea = e.target
      textarea.style.height = 'auto' // Reset height
      textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px` // Max 10-12 lines
    }
  }
  
  const toggleTextareaExpand = () => {
    setIsTextareaExpanded(!isTextareaExpanded)
  }

  const handleTagAdded = async () => {
    if (!conversationId) return
    
    const { data: msgs } = await supabase
      .from('messages')
      .select(`
        *,
        tags:memory_tags(id, tag_type, custom_label)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true }) as any

    if (msgs) {
      setMessages(msgs)
    }
  }

  // List View
  if (!conversationId) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8 py-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
              Talk with Passage
            </h1>
            
            <button
              onClick={() => router.push('/talk?id=new')}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <span className="text-xl">💬</span>
              New Conversation
            </button>
          </header>

          {loadingList ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-600 dark:text-slate-400">Loading conversations...</div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8 text-center">
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                No conversations yet
              </p>
              <p className="text-slate-500 dark:text-slate-500 text-sm">
                Start your first conversation with Passage
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                Past Conversations
              </h2>
              {conversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => router.push(`/talk?id=${convo.id}`)}
                  className="w-full bg-white dark:bg-slate-800 rounded-lg shadow p-4 hover:shadow-lg transition-shadow text-left"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <p className="text-slate-900 dark:text-slate-50 font-medium line-clamp-2 flex-1">
                      {convo.first_message}
                    </p>
                    <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(convo.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>💬 {convo.message_count} messages</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Chat View
  if (loadingHistory) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading conversation...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={() => router.push('/talk')}
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
            >
              ← Back
            </button>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Conversation
            </h1>
            <div className="w-16"></div>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-slate-600 dark:text-slate-400">Focus:</span>
            <span className="font-medium text-slate-900 dark:text-slate-50">{getEntryPointLabel(entryPoint)}</span>
            <button
              onClick={() => setShowEntryPointSelector(true)}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Change
            </button>
          </div>
        </div>
      </header>

      {/* Entry Point Selector Modal */}
      {showEntryPointSelector && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
              Change Conversation Focus
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              This helps me provide more relevant support for what you're navigating.
            </p>
            <div className="space-y-2">
              {[
                { value: 'burnout', label: 'Burnout', desc: 'Recovery from work exhaustion' },
                { value: 'grief', label: 'Grief & Loss', desc: 'Navigating loss of any kind' },
                { value: 'divorce', label: 'Divorce/Separation', desc: 'Life after relationship end' },
                { value: 'addiction', label: 'Addiction Recovery', desc: 'Support in recovery journey' },
                { value: 'career', label: 'Career Crisis', desc: 'Transitions and uncertainty' },
                { value: 'illness', label: 'Illness Recovery', desc: 'Healing from physical illness' },
                { value: 'transition', label: 'Life Transition', desc: 'Major life changes' },
                { value: 'other', label: 'General Support', desc: 'Something else' },
              ].map((ep) => (
                <button
                  key={ep.value}
                  onClick={() => handleEntryPointChange(ep.value)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                    entryPoint === ep.value
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="font-semibold text-slate-900 dark:text-slate-50">{ep.label}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">{ep.desc}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowEntryPointSelector(false)}
              className="mt-4 w-full px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4" style={{ paddingBottom: '440px' }}>
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Start a conversation with Passage
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Share what's on your mind. I'm here to listen and support you.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] md:max-w-[70%] rounded-lg px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900'
                      : 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-50'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <div className="flex items-center gap-2">
                      <p className={`text-xs ${
                        msg.role === 'user' 
                          ? 'text-slate-300 dark:text-slate-600' 
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      {/* Voice controls for AI messages */}
                      {msg.role === 'assistant' && (
                        <>
                          {voiceEnabled && (
                            <button
                              onClick={() => playingMessageId === msg.id ? stopPlaying() : playMessage(msg.id, msg.content)}
                              className="text-xs px-2 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                              {playingMessageId === msg.id ? (
                                <>
                                  <span>⏸</span>
                                  <span>Stop</span>
                                </>
                              ) : (
                                <>
                                  <span>🔊</span>
                                  <span>Play</span>
                                </>
                              )}
                            </button>
                          )}
                          <button
                            onClick={toggleVoice}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            title={voiceEnabled ? 'Mute voice responses' : 'Enable voice responses'}
                          >
                            {voiceEnabled ? (
                              <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                              </svg>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                    {/* Tags only on user messages */}
                    {msg.role === 'user' && (
                      <MessageTag
                        messageId={msg.id}
                        existingTags={msg.tags}
                        onTagAdded={handleTagAdded}
                        isUserMessage={true}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-4 py-3 bg-slate-100 dark:bg-slate-700">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4" style={{ bottom: '64px' }}>
        <div className="max-w-4xl mx-auto">
          {/* Voice Recorder */}
          <div className="mb-4">
            <VoiceRecorder 
              onTranscriptReady={handleTranscriptReady}
              disabled={loading}
            />
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
            <span className="text-xs text-slate-500 dark:text-slate-400">or type</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
          </div>

          <div className="flex gap-2 items-end relative">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={handleTextareaChange}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={loading}
                rows={1}
                className="w-full px-4 py-3 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-50 transition-all duration-200"
                style={{ minHeight: '52px', maxHeight: '300px', overflow: 'auto' }}
              />
              {/* Expand button - only show when there's text */}
              {inputMessage && !isTextareaExpanded && (
                <button
                  onClick={toggleTextareaExpand}
                  className="absolute right-2 bottom-2 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  title="Expand to full screen"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={handleSend}
              disabled={!inputMessage.trim() || loading}
              className="px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Send
            </button>
          </div>
          
          {/* Full-screen expanded view */}
          {isTextareaExpanded && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    Review Your Message
                  </h3>
                  <button
                    onClick={toggleTextareaExpand}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    title="Collapse"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={loading}
                  className="flex-1 p-6 border-0 focus:ring-0 resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-50 text-base"
                  autoFocus
                />
                <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {inputMessage.length} characters
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={toggleTextareaExpand}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                      Collapse
                    </button>
                    <button
                      onClick={() => {
                        toggleTextareaExpand()
                        handleSend()
                      }}
                      disabled={!inputMessage.trim() || loading}
                      className="px-6 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
