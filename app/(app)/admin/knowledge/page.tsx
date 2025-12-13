'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const ENTRY_POINTS = [
  'addiction', 'grief', 'divorce', 'burnout', 'career', 'illness', 'transition', 'general'
]

const TAG_GROUPS = {
  Emotional: ['anxiety', 'depression', 'anger', 'loneliness', 'shame', 'guilt', 'fear', 'hopelessness', 'overwhelm'],
  Relationships: ['marriage', 'co-parenting', 'family', 'friendship', 'boundaries', 'trust', 'betrayal', 'communication', 'conflict'],
  Psychology: ['nervous-system', 'trauma', 'attachment', 'coping', 'triggers', 'patterns', 'identity', 'self-worth', 'resilience', 'neuroscience'],
  Recovery: ['recovery', 'relapse', 'progress', 'setbacks', 'milestones', 'healing', 'acceptance', 'change'],
  Practical: ['sleep', 'exercise', 'nutrition', 'routine', 'work', 'finances', 'legal', 'parenting'],
  Therapeutic: ['cbt', 'mindfulness', 'grounding', 'regulation', 'window-of-tolerance', 'urge-surfing', 'self-compassion']
}

interface KnowledgeEntry {
  id: string
  type: string
  entry_point: string
  title: string
  content: string
  tags: string[]
  file_url?: string
  file_name?: string
  file_type?: string
}

export default function AdminKnowledgePage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  
  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState('education')
  const [selectedEntryPoints, setSelectedEntryPoints] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileDescription, setFileDescription] = useState('')
  const [transcribeAudio, setTranscribeAudio] = useState(false)
  
  // Existing entries
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/signin')
        return
      }

      // Check if user is admin by fetching entries (API will reject if not admin)
      const response = await fetch('/api/admin/knowledge')
      
      if (response.ok) {
        setIsAdmin(true)
        const data = await response.json()
        setEntries(data.entries || [])
      } else {
        router.push('/home')
      }
    } catch (error) {
      console.error('Error checking admin:', error)
      router.push('/home')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      setMessage('Please fill in title')
      return
    }

    if (inputMode === 'text' && !content.trim()) {
      setMessage('Please fill in content')
      return
    }

    if (inputMode === 'file' && !selectedFile) {
      setMessage('Please select a file')
      return
    }

    if (inputMode === 'file' && selectedFile && (selectedFile.type.startsWith('audio/') || selectedFile.type.startsWith('video/'))) {
      if (!transcribeAudio && !fileDescription.trim()) {
        setMessage('Please provide a description or enable auto-transcription')
        return
      }
    }

    if (selectedEntryPoints.length === 0) {
      setMessage('Please select at least one entry point')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      if (inputMode === 'file' && selectedFile) {
        // Handle file upload
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('title', title)
        formData.append('type', type)
        formData.append('entry_points', JSON.stringify(selectedEntryPoints))
        formData.append('tags', JSON.stringify(selectedTags))
        formData.append('file_description', fileDescription)
        formData.append('transcribe', transcribeAudio.toString())

        const response = await fetch('/api/admin/knowledge/upload', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          setMessage('✅ Knowledge added successfully!')
          // Clear form
          setTitle('')
          setContent('')
          setType('education')
          setSelectedEntryPoints([])
          setSelectedTags([])
          setSelectedFile(null)
          setFileDescription('')
          setTranscribeAudio(false)
          setInputMode('text')
          // Reload entries
          const refreshResponse = await fetch('/api/admin/knowledge')
          const data = await refreshResponse.json()
          setEntries(data.entries || [])
        } else {
          const error = await response.json()
          setMessage(`❌ Failed to add knowledge: ${error.error || 'Unknown error'}`)
        }
      } else {
        // Handle text entry
        const response = await fetch('/api/admin/knowledge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            content,
            type,
            entry_points: selectedEntryPoints,
            tags: selectedTags,
          }),
        })

        if (response.ok) {
          setMessage('✅ Knowledge added successfully!')
          // Clear form
          setTitle('')
          setContent('')
          setType('education')
          setSelectedEntryPoints([])
          setSelectedTags([])
          // Reload entries
          const refreshResponse = await fetch('/api/admin/knowledge')
          const data = await refreshResponse.json()
          setEntries(data.entries || [])
        } else {
          setMessage('❌ Failed to add knowledge')
        }
      }
    } catch (error) {
      console.error('Error saving:', error)
      setMessage('❌ Error saving knowledge')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/knowledge?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMessage('✅ Entry deleted')
        setEntries(entries.filter(e => e.id !== id))
      } else {
        setMessage('❌ Failed to delete')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      setMessage('❌ Error deleting')
    }
  }

  const toggleEntryPoint = (ep: string) => {
    if (selectedEntryPoints.includes(ep)) {
      setSelectedEntryPoints(selectedEntryPoints.filter(e => e !== ep))
    } else {
      setSelectedEntryPoints([...selectedEntryPoints, ep])
    }
  }

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-slate-600">Loading...</div>
    </div>
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-8">
          Knowledge Management
        </h1>

        {/* Add Knowledge Form */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-6">
            Add New Knowledge
          </h2>

          {message && (
            <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-700 rounded text-sm">
              {message}
            </div>
          )}

          {/* Input Mode Toggle */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Input Mode
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={inputMode === 'text'}
                  onChange={() => setInputMode('text')}
                  className="w-4 h-4"
                />
                <span className="text-slate-700 dark:text-slate-300">Manual Text Entry</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={inputMode === 'file'}
                  onChange={() => setInputMode('file')}
                  className="w-4 h-4"
                />
                <span className="text-slate-700 dark:text-slate-300">File Upload</span>
              </label>
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
              placeholder="e.g., Understanding Triggers"
            />
          </div>

          {inputMode === 'text' ? (
            /* Manual Text Content */
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                rows={8}
                placeholder="Write the knowledge content here..."
              />
            </div>
          ) : (
            /* File Upload */
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Upload File
              </label>
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md,.mp3,.mp4"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  setSelectedFile(file || null)
                  if (file) {
                    // Auto-fill title if empty
                    if (!title) {
                      setTitle(file.name.replace(/\.[^/.]+$/, ''))
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-600 dark:file:text-slate-200"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Accepted: PDF, DOCX, TXT, MD, MP3, MP4 (max 50MB)
              </p>
              
              {selectedFile && (
                <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-700 rounded text-sm flex items-center justify-between">
                  <div>
                    <strong>Selected:</strong> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null)
                      setFileDescription('')
                      setTranscribeAudio(false)
                      // Clear the file input
                      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
                      if (fileInput) fileInput.value = ''
                    }}
                    className="ml-4 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Description field - optional for PDFs (auto-extracted), required for others */}
              {selectedFile && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Content Description / Summary {selectedFile.type !== 'application/pdf' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    value={fileDescription}
                    onChange={(e) => setFileDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                    rows={6}
                    placeholder={
                      selectedFile.type === 'application/pdf' 
                        ? "Optional: Add additional context or notes (PDF text will be automatically extracted using Claude AI)"
                        : "Required: Paste or describe the content of this file..."
                    }
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {selectedFile.type === 'application/pdf' 
                      ? "✨ PDFs are automatically processed using Claude AI for text extraction"
                      : "For non-PDF files, please provide the content or a detailed description"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Type
            </label>
            <div className="flex gap-4">
              {['education', 'story', 'exercise', 'framework'].map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={type === t}
                    onChange={() => setType(t)}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-700 dark:text-slate-300 capitalize">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Entry Points */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Entry Points
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ENTRY_POINTS.map((ep) => (
                <label key={ep} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEntryPoints.includes(ep)}
                    onChange={() => toggleEntryPoint(ep)}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-700 dark:text-slate-300 capitalize">{ep}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tags
            </label>
            <div className="space-y-4">
              {Object.entries(TAG_GROUPS).map(([group, tags]) => (
                <div key={group}>
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    {group}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {tags.map((tag) => (
                      <label key={tag} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={() => toggleTag(tag)}
                          className="w-4 h-4"
                        />
                        <span className="text-xs text-slate-700 dark:text-slate-300">{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-50 dark:text-slate-900"
          >
            {saving ? 'Saving...' : 'Save Knowledge'}
          </button>
        </div>

        {/* Existing Knowledge */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-6">
            Existing Knowledge ({entries.length})
          </h2>

          {entries.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              No knowledge entries yet
            </p>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-1">
                        {entry.title}
                      </h3>
                      <div className="flex gap-2 flex-wrap text-xs mb-2">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                          {entry.type}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                          {entry.entry_point}
                        </span>
                        {entry.file_type && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                            📎 {entry.file_type.toUpperCase()}
                          </span>
                        )}
                      </div>
                      {entry.file_name && (
                        <div className="mb-2">
                          <a 
                            href={entry.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            🔗 {entry.file_name}
                          </a>
                        </div>
                      )}
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap text-xs">
                          {entry.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {entry.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
