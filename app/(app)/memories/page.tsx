'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { TagType } from '@/types'

interface TaggedMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  created_at: string
  conversation_id: string
  tag_type: TagType
  custom_label?: string
}

type TabType = 'all' | 'therapist'

export default function MemoriesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [taggedMessages, setTaggedMessages] = useState<TaggedMessage[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadTaggedMessages()
  }, [])

  const loadTaggedMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Query messages with their tags
      const { data, error } = await supabase
        .from('memory_tags')
        .select(`
          id,
          tag_type,
          custom_label,
          created_at,
          messages:message_id (
            id,
            content,
            role,
            created_at,
            conversation_id
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) as any

      if (error) {
        console.error('Error loading tagged messages:', error)
        return
      }

      // Flatten the data structure
      const flattened = data
        .filter((item: any) => item.messages) // Filter out any with null messages
        .map((item: any) => ({
          id: item.messages.id,
          content: item.messages.content,
          role: item.messages.role,
          created_at: item.messages.created_at,
          conversation_id: item.messages.conversation_id,
          tag_type: item.tag_type,
          custom_label: item.custom_label,
        }))

      setTaggedMessages(flattened)
    } catch (error) {
      console.error('Error loading tagged messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredMessages = () => {
    if (activeTab === 'all') return taggedMessages
    if (activeTab === 'therapist') {
      return taggedMessages.filter(msg => msg.tag_type === 'therapist')
    }
    return taggedMessages
  }

  // Group messages by custom label for better organization
  const groupMessagesByCustomLabel = (messages: TaggedMessage[]) => {
    const customMessages = messages.filter(msg => msg.tag_type === 'custom' && msg.custom_label)
    const groups: Record<string, TaggedMessage[]> = {}
    
    customMessages.forEach(msg => {
      const label = msg.custom_label || 'Other'
      if (!groups[label]) {
        groups[label] = []
      }
      groups[label].push(msg)
    })
    
    return groups
  }

  const getTagLabel = (tagType: TagType, customLabel?: string) => {
    if (tagType === 'custom' && customLabel) return customLabel
    const labels: Record<TagType, string> = {
      remind: '💡 Remember',
      therapist: '🗣️ Therapist',
      pattern: '🔍 Pattern',
      custom: '✏️ Custom',
      important: '⭐ Important'
    }
    return labels[tagType]
  }

  const filteredMessages = getFilteredMessages()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading memories...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 py-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Memories
          </h1>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-slate-900 text-slate-900 dark:border-slate-50 dark:text-slate-50'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50'
            }`}
          >
            All ({taggedMessages.length})
          </button>
          <button
            onClick={() => setActiveTab('therapist')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'therapist'
                ? 'border-slate-900 text-slate-900 dark:border-slate-50 dark:text-slate-50'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50'
            }`}
          >
            Therapist ({taggedMessages.filter(m => m.tag_type === 'therapist').length})
          </button>
        </div>

        {/* Tagged Messages */}
        {filteredMessages.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              No tagged messages yet
            </p>
            <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
              Tag messages in your conversations to save them here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Group custom tags by label in "All" tab */}
            {activeTab === 'all' && (() => {
              const customGroups = groupMessagesByCustomLabel(filteredMessages)
              const nonCustomMessages = filteredMessages.filter(msg => msg.tag_type !== 'custom')
              
              return (
                <>
                  {/* Non-custom messages */}
                  {nonCustomMessages.length > 0 && (
                    <div className="space-y-4">
                      {nonCustomMessages.map((msg) => (
                        <Link
                          key={msg.id}
                          href={`/talk?conversation=${msg.conversation_id}`}
                          className="block bg-white dark:bg-slate-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm rounded-full">
                              {getTagLabel(msg.tag_type, msg.custom_label)}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(msg.created_at).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          
                          <p className="text-slate-900 dark:text-slate-50 mb-2 line-clamp-3">
                            {msg.content}
                          </p>
                          
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className={`px-2 py-1 rounded ${
                              msg.role === 'user'
                                ? 'bg-slate-100 dark:bg-slate-700'
                                : 'bg-blue-50 dark:bg-blue-900/20'
                            }`}>
                              {msg.role === 'user' ? 'You' : 'Passage'}
                            </span>
                            <span>→ View conversation</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  
                  {/* Custom tags grouped by label */}
                  {Object.entries(customGroups).map(([label, messages]) => (
                    <div key={label} className="space-y-4">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                        <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-sm rounded-full">
                          ✏️ {label}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">({messages.length})</span>
                      </h2>
                      {messages.map((msg) => (
                        <Link
                          key={msg.id}
                          href={`/talk?conversation=${msg.conversation_id}`}
                          className="block bg-white dark:bg-slate-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow ml-4"
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(msg.created_at).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          
                          <p className="text-slate-900 dark:text-slate-50 mb-2 line-clamp-3">
                            {msg.content}
                          </p>
                          
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className={`px-2 py-1 rounded ${
                              msg.role === 'user'
                                ? 'bg-slate-100 dark:bg-slate-700'
                                : 'bg-blue-50 dark:bg-blue-900/20'
                            }`}>
                              {msg.role === 'user' ? 'You' : 'Passage'}
                            </span>
                            <span>→ View conversation</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ))}
                </>
              )
            })()}
            
            {/* For therapist tab, show messages normally */}
            {activeTab === 'therapist' && filteredMessages.map((msg) => (
              <Link
                key={msg.id}
                href={`/talk?conversation=${msg.conversation_id}`}
                className="block bg-white dark:bg-slate-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm rounded-full">
                    {getTagLabel(msg.tag_type, msg.custom_label)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(msg.created_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                
                <p className="text-slate-900 dark:text-slate-50 mb-2 line-clamp-3">
                  {msg.content}
                </p>
                
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className={`px-2 py-1 rounded ${
                    msg.role === 'user'
                      ? 'bg-slate-100 dark:bg-slate-700'
                      : 'bg-blue-50 dark:bg-blue-900/20'
                  }`}>
                    {msg.role === 'user' ? 'You' : 'Passage'}
                  </span>
                  <span>→ View conversation</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
