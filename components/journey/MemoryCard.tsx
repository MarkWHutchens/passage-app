'use client'

import { useState } from 'react'
import Link from 'next/link'
import TagDropdown from './TagDropdown'

interface MemoryCardProps {
  tagId: string
  content: string
  taggedAt: string
  conversationId: string
  conversationTitle: string | null
  tagType: string
  customLabel: string | null
  customTags: string[]
  onTagChange: (tagId: string, newTagType: string, newCustomLabel?: string) => void
  onRemove: (tagId: string) => void
}

export default function MemoryCard({
  tagId,
  content,
  taggedAt,
  conversationId,
  conversationTitle,
  tagType,
  customLabel,
  customTags,
  onTagChange,
  onRemove
}: MemoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const truncatedContent = content.length > 100 
    ? content.substring(0, 100) + '...' 
    : content

  const displayContent = isExpanded ? content : truncatedContent

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const handleRemove = () => {
    if (confirm('Remove this tag? The message will remain in your conversation.')) {
      onRemove(tagId)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 overflow-hidden transition-all">
      {/* Content Area - Clickable to expand/collapse */}
      <div 
        onClick={() => content.length > 100 && setIsExpanded(!isExpanded)}
        className={`p-4 ${content.length > 100 ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50' : ''} transition-colors`}
      >
        <p className="text-slate-900 dark:text-slate-50 text-sm whitespace-pre-wrap">
          {displayContent}
        </p>
      </div>

      {/* Metadata and Actions */}
      <div className="px-4 pb-4 space-y-3">
        {/* Date and Conversation Link */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Tagged: {formatDate(taggedAt)}</span>
          <span>•</span>
          <Link 
            href={`/talk?conversation=${conversationId}`}
            className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1"
          >
            From: {conversationTitle || 'Untitled Conversation'}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3">
          <TagDropdown
            currentTagType={tagType}
            currentCustomLabel={customLabel}
            customTags={customTags}
            onSelect={(newTagType, newCustomLabel) => onTagChange(tagId, newTagType, newCustomLabel)}
          />

          <button
            onClick={handleRemove}
            className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}
