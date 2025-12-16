'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TagType } from '@/types'

interface MessageTagProps {
  messageId: string
  existingTags?: Array<{ tag_type: TagType; custom_label?: string }>
  onTagAdded?: () => void
  isUserMessage?: boolean
}

export default function MessageTag({ messageId, existingTags = [], onTagAdded, isUserMessage }: MessageTagProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customLabel, setCustomLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [recentCustomTags, setRecentCustomTags] = useState<string[]>([])
  const supabase = createClient()

  const hasTag = existingTags.length > 0

  // Load recent custom tags when menu opens
  useEffect(() => {
    if (showMenu) {
      loadRecentCustomTags()
    }
  }, [showMenu])

  const loadRecentCustomTags = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('memory_tags')
        .select('custom_label')
        .eq('user_id', user.id)
        .eq('tag_type', 'custom')
        .not('custom_label', 'is', null)
        .order('created_at', { ascending: false }) as any

      if (data) {
        // Get unique custom labels
        const uniqueLabels = Array.from(new Set(data.map((t: any) => t.custom_label).filter(Boolean))) as string[]
        setRecentCustomTags(uniqueLabels.slice(0, 5)) // Show max 5 recent tags
      }
    } catch (error) {
      console.error('Error loading recent tags:', error)
    }
  }

  const handleTagClick = async (tagType: TagType, label?: string) => {
    setSaving(true)
    try {
      const response = await fetch('/api/memories/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          tagType,
          customLabel: label,
        }),
      })

      if (response.ok) {
        setShowMenu(false)
        setShowCustomInput(false)
        setCustomLabel('')
        onTagAdded?.()
      }
    } catch (error) {
      console.error('Error adding tag:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCustomSubmit = () => {
    if (customLabel.trim()) {
      handleTagClick('custom', customLabel.trim())
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`p-1.5 rounded-full transition-colors ${
          hasTag 
            ? 'text-blue-400 bg-blue-900/30 hover:bg-blue-900/40' 
            : isUserMessage 
              ? 'text-white border-2 border-white/50 hover:bg-white/20 hover:border-white/70' 
              : 'text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'
        }`}
        title={hasTag ? 'Tagged' : 'Add tag'}
      >
        {hasTag ? (
          <svg className={`${isUserMessage ? 'w-5 h-5' : 'w-4 h-4'}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        ) : (
          <svg className={`${isUserMessage ? 'w-5 h-5' : 'w-4 h-4'}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        )}
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setShowMenu(false)
              setShowCustomInput(false)
            }}
          />
          <div className={`absolute z-20 mt-2 ${
            isUserMessage ? 'right-0' : 'left-0'
          } bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 py-2 min-w-[200px]`}>
            {!showCustomInput ? (
              <>
                <button
                  onClick={() => handleTagClick('remind')}
                  disabled={saving}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 disabled:opacity-50"
                >
                  💡 Remember this
                </button>
                <button
                  onClick={() => handleTagClick('therapist')}
                  disabled={saving}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 disabled:opacity-50"
                >
                  🗣️ Tell my therapist
                </button>
                <button
                  onClick={() => handleTagClick('pattern')}
                  disabled={saving}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 disabled:opacity-50"
                >
                  🔍 Pattern to watch
                </button>
                
                {/* Recent Custom Tags Section */}
                {recentCustomTags.length > 0 && (
                  <>
                    <div className="border-t border-slate-200 dark:border-slate-600 my-1" />
                    <div className="px-4 py-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Recent Tags</p>
                    </div>
                    {recentCustomTags.map((tag, index) => (
                      <button
                        key={index}
                        onClick={() => handleTagClick('custom', tag)}
                        disabled={saving}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 disabled:opacity-50"
                      >
                        ✏️ {tag}
                      </button>
                    ))}
                  </>
                )}
                
                <div className="border-t border-slate-200 dark:border-slate-600 my-1" />
                <button
                  onClick={() => setShowCustomInput(true)}
                  disabled={saving}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 disabled:opacity-50"
                >
                  ✏️ Add new custom tag...
                </button>
              </>
            ) : (
              <div className="px-4 py-2">
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
                  placeholder="Enter tag name"
                  className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-500 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  autoFocus
                  disabled={saving}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleCustomSubmit}
                    disabled={!customLabel.trim() || saving}
                    className="flex-1 px-2 py-1 text-xs bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-50 dark:text-slate-900"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomInput(false)
                      setCustomLabel('')
                    }}
                    disabled={saving}
                    className="flex-1 px-2 py-1 text-xs border border-slate-300 dark:border-slate-500 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
