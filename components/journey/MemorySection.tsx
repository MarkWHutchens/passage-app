'use client'

import { useState } from 'react'
import MemoryCard from './MemoryCard'
import PrintButton from './PrintButton'
import ExportButton from './ExportButton'
import { TaggedMessage } from '@/lib/memories/server-actions'

interface MemorySectionProps {
  title: string
  items: TaggedMessage[]
  defaultExpanded?: boolean
  customTags: string[]
  onTagChange: (tagId: string, newTagType: string, newCustomLabel?: string) => void
  onRemove: (tagId: string) => void
}

export default function MemorySection({
  title,
  items,
  defaultExpanded,
  customTags,
  onTagChange,
  onRemove
}: MemorySectionProps) {
  const shouldDefaultExpand = defaultExpanded ?? (items.length <= 5)
  const [isExpanded, setIsExpanded] = useState(shouldDefaultExpand)

  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
        >
          <svg 
            className={`w-5 h-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          
          <h3 className="font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </h3>
          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
            {items.length}
          </span>
        </button>
        
        <div className="flex items-center gap-2">
          <PrintButton />
          <ExportButton 
            data={items}
            filename={`${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`}
            title={title}
          />
        </div>
      </div>

      {/* Cards */}
      {isExpanded && (
        <div className="space-y-3">
          {items.map((item) => (
            <MemoryCard
              key={item.tagId}
              tagId={item.tagId}
              content={item.content}
              taggedAt={item.taggedAt}
              conversationId={item.conversationId}
              conversationTitle={item.conversationTitle}
              tagType={item.tagType}
              customLabel={item.customLabel}
              customTags={customTags}
              onTagChange={onTagChange}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  )
}
