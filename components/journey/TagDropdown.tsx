'use client'

import { useState, useRef, useEffect } from 'react'

interface TagDropdownProps {
  currentTagType: string
  currentCustomLabel: string | null
  customTags: string[]
  onSelect: (tagType: string, customLabel?: string) => void
}

const BUILT_IN_TAGS = [
  { type: 'remind', label: 'Remember This' },
  { type: 'therapist', label: 'Tell My Therapist' },
  { type: 'pattern', label: 'Patterns to Watch' }
]

export default function TagDropdown({
  currentTagType,
  currentCustomLabel,
  customTags,
  onSelect
}: TagDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsCreating(false)
        setNewTagName('')
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setIsCreating(false)
        setNewTagName('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  // Focus input when creating new tag
  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isCreating])

  const handleSelect = (tagType: string, customLabel?: string) => {
    onSelect(tagType, customLabel)
    setIsOpen(false)
    setIsCreating(false)
    setNewTagName('')
  }

  const handleCreateNew = () => {
    if (newTagName.trim()) {
      handleSelect('custom', newTagName.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateNew()
    }
  }

  const isSelected = (tagType: string, customLabel?: string) => {
    if (tagType === 'custom' && customLabel) {
      return currentTagType === 'custom' && currentCustomLabel === customLabel
    }
    return currentTagType === tagType
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors flex items-center gap-1"
      >
        Change Tag
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
          {/* Built-in tags */}
          {BUILT_IN_TAGS.map((tag) => (
            <button
              key={tag.type}
              onClick={() => handleSelect(tag.type)}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
            >
              <span>{tag.label}</span>
              {isSelected(tag.type) && (
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}

          {/* Divider */}
          {customTags.length > 0 && (
            <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
          )}

          {/* Custom tags */}
          {customTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleSelect('custom', tag)}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
            >
              <span>{tag}</span>
              {isSelected('custom', tag) && (
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}

          {/* Divider before create new */}
          <div className="my-1 border-t border-slate-200 dark:border-slate-700" />

          {/* Create new tag */}
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full text-left px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              + Create New Tag
            </button>
          ) : (
            <div className="px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tag name..."
                className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Press Enter to create
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
