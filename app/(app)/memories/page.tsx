'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { TagType } from '@/types'
import PrintButton from '@/components/journey/PrintButton'
import ExportButton from '@/components/journey/ExportButton'

interface TaggedMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  created_at: string
  conversation_id: string
  tag_type: TagType
  custom_label?: string
}

export default function MemoriesPage() {
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

      const flattened = data
        .filter((item: any) => item.messages)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading memories...</div>
      </div>
    )
  }

  // Group memories by tag type
  const therapistMemories = taggedMessages.filter(m => m.tag_type === 'therapist')
  const rememberMemories = taggedMessages.filter(m => m.tag_type === 'remind')
  const patternMemories = taggedMessages.filter(m => m.tag_type === 'pattern')
  const customMemories: { [key: string]: TaggedMessage[] } = {}
  taggedMessages.forEach(m => {
    if (m.tag_type === 'custom' && m.custom_label) {
      if (!customMemories[m.custom_label]) {
        customMemories[m.custom_label] = []
      }
      customMemories[m.custom_label].push(m)
    }
  })

  const hasMemories = taggedMessages.length > 0

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 py-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Memories
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Tagged messages from your conversations
          </p>
        </header>

        {!hasMemories ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              When something feels important, tag it. Your saved moments will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tell My Therapist */}
            {therapistMemories.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                    Tell My Therapist
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                      {therapistMemories.length}
                    </span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <PrintButton />
                    <ExportButton 
                      data={therapistMemories}
                      filename={`therapist-notes-${new Date().toISOString().split('T')[0]}`}
                      title="Tell My Therapist"
                    />
                  </div>
                </div>
                {therapistMemories.map((memory) => (
                  <Link
                    key={memory.id}
                    href={`/talk?conversation=${memory.conversation_id}`}
                    className="block bg-white dark:bg-slate-800 rounded-lg shadow p-4 hover:shadow-lg transition"
                  >
                    <p className="text-slate-900 dark:text-slate-50 text-sm mb-2">
                      {memory.content}
                    </p>
                    <div className="text-xs text-slate-500">
                      {new Date(memory.created_at).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Remember This */}
            {rememberMemories.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                    Remember This
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                      {rememberMemories.length}
                    </span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <PrintButton />
                    <ExportButton 
                      data={rememberMemories}
                      filename={`remember-this-${new Date().toISOString().split('T')[0]}`}
                      title="Remember This"
                    />
                  </div>
                </div>
                {rememberMemories.map((memory) => (
                  <Link
                    key={memory.id}
                    href={`/talk?conversation=${memory.conversation_id}`}
                    className="block bg-white dark:bg-slate-800 rounded-lg shadow p-4 hover:shadow-lg transition"
                  >
                    <p className="text-slate-900 dark:text-slate-50 text-sm mb-2">
                      {memory.content}
                    </p>
                    <div className="text-xs text-slate-500">
                      {new Date(memory.created_at).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Patterns to Watch */}
            {patternMemories.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                    Patterns to Watch
                    <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 text-xs font-medium rounded-full">
                      {patternMemories.length}
                    </span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <PrintButton />
                    <ExportButton 
                      data={patternMemories}
                      filename={`patterns-to-watch-${new Date().toISOString().split('T')[0]}`}
                      title="Patterns to Watch"
                    />
                  </div>
                </div>
                {patternMemories.map((memory) => (
                  <Link
                    key={memory.id}
                    href={`/talk?conversation=${memory.conversation_id}`}
                    className="block bg-white dark:bg-slate-800 rounded-lg shadow p-4 hover:shadow-lg transition"
                  >
                    <p className="text-slate-900 dark:text-slate-50 text-sm mb-2">
                      {memory.content}
                    </p>
                    <div className="text-xs text-slate-500">
                      {new Date(memory.created_at).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Custom Tags */}
            {Object.entries(customMemories).map(([label, items]) => (
              <div key={label} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                    {label}
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                      {items.length}
                    </span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <PrintButton />
                    <ExportButton 
                      data={items}
                      filename={`${label.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`}
                      title={label}
                    />
                  </div>
                </div>
                {items.map((memory) => (
                  <Link
                    key={memory.id}
                    href={`/talk?conversation=${memory.conversation_id}`}
                    className="block bg-white dark:bg-slate-800 rounded-lg shadow p-4 hover:shadow-lg transition"
                  >
                    <p className="text-slate-900 dark:text-slate-50 text-sm mb-2">
                      {memory.content}
                    </p>
                    <div className="text-xs text-slate-500">
                      {new Date(memory.created_at).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
