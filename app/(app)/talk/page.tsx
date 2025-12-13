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
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null)
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
    } else {
      loadConversationList()
    }
    
    // Load voice preference from localStorage
    const savedVoicePreference = localStorage.getItem('voiceEnabled')
    if (savedVoicePreference === 'true') {
      setVoiceEnabled(true)
    }
  }, [conversationId])

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

  const toggleVoice = () => {
    const newValue = !voiceEnabled
    setVoiceEnabled(newValue)
    localStorage.setItem('voiceEnabled', newValue.toString())
    
    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlayingMessageId(null)
    }
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

      // Reload messages from database to get real IDs
      if (conversationId) {
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
    setTimeout(() => {
      handleSend()
    }, 100)
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
        <div className="max-w-4xl mx-auto flex items-center justify-between">
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
      </header>

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
                      {/* Play button for AI messages when voice mode is on */}
                      {msg.role === 'assistant' && voiceEnabled && (
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
                    </div>
                    {!msg.id.startsWith('temp-') && (
                      <MessageTag
                        messageId={msg.id}
                        existingTags={msg.tags}
                        onTagAdded={handleTagAdded}
                        isUserMessage={msg.role === 'user'}
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
          {/* Voice Mode Toggle */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <button
              onClick={() => toggleVoice()}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                !voiceEnabled
                  ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
              }`}
            >
              💬 Text
            </button>
            <button
              onClick={() => !voiceEnabled && toggleVoice()}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                voiceEnabled
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
              }`}
            >
              🎙️ Voice
            </button>
          </div>

          {/* Voice Recorder with Visual Indicator */}
          <div className={`mb-4 relative ${voiceEnabled ? 'ring-2 ring-blue-500 ring-offset-2 rounded-xl' : ''}`}>
            <VoiceRecorder 
              onTranscriptReady={handleTranscriptReady}
              disabled={loading}
            />
            {voiceEnabled && (
              <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                Voice Mode
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
            <span className="text-xs text-slate-500 dark:text-slate-400">or type</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
          </div>

          <div className="flex gap-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={loading}
              rows={1}
              className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-50"
              style={{ minHeight: '52px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSend}
              disabled={!inputMessage.trim() || loading}
              className="px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
            {voiceEnabled ? 'Voice mode: Responses will be spoken' : 'Press Enter to send, Shift+Enter for new line'}
          </p>
        </div>
      </div>
    </div>
  )
}
