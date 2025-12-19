'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { EntryPoint, Country } from '@/types'

type Voice = 'alloy' | 'echo' | 'fable' | 'nova' | 'onyx' | 'shimmer'

const VOICE_OPTIONS: { value: Voice; label: string; description: string }[] = [
  { value: 'alloy', label: 'Alloy', description: 'Neutral and balanced' },
  { value: 'echo', label: 'Echo', description: 'Warm and friendly' },
  { value: 'fable', label: 'Fable', description: 'Calm and reassuring' },
  { value: 'nova', label: 'Nova', description: 'Bright and clear' },
  { value: 'onyx', label: 'Onyx', description: 'Deep and grounding' },
  { value: 'shimmer', label: 'Shimmer', description: 'Soft and gentle' },
]

const ENTRY_POINTS: { value: EntryPoint; label: string }[] = [
  { value: 'burnout', label: 'Burnout' },
  { value: 'grief', label: 'Grief & Loss' },
  { value: 'divorce', label: 'Divorce/Separation' },
  { value: 'addiction', label: 'Addiction Recovery' },
  { value: 'career', label: 'Career Crisis' },
  { value: 'illness', label: 'Illness Recovery' },
  { value: 'transition', label: 'Life Transition' },
  { value: 'other', label: 'Other' },
]

const COUNTRIES: { value: Country; label: string }[] = [
  { value: 'australia', label: 'Australia' },
  { value: 'united-states', label: 'United States' },
  { value: 'united-kingdom', label: 'United Kingdom' },
  { value: 'canada', label: 'Canada' },
  { value: 'new-zealand', label: 'New Zealand' },
  { value: 'ireland', label: 'Ireland' },
  { value: 'other', label: 'Other' },
]

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  
  // Profile state
  const [name, setName] = useState('')
  const [country, setCountry] = useState<Country>('australia')
  const [entryPoint, setEntryPoint] = useState<EntryPoint>('other')
  const [selectedVoice, setSelectedVoice] = useState<Voice>('nova')
  const [playingVoice, setPlayingVoice] = useState<Voice | null>(null)
  
  // Account state
  const [email, setEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showClearMemoriesModal, setShowClearMemoriesModal] = useState(false)
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  useEffect(() => {
    loadUserSettings()
  }, [])

  const loadUserSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEmail(user.email || '')

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single() as any

      if (data) {
        setName(data.name || '')
        setCountry(data.country || 'australia')
        setEntryPoint(data.entry_point || 'other')
        setSelectedVoice(data.voice_preference || 'nova')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('users')
        .update({
          name: name.trim() || null,
          country,
          entry_point: entryPoint,
        } as any)
        .eq('id', user.id)

      if (error) throw error
      alert('Profile updated successfully')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleVoiceChange = async (voice: Voice) => {
    setSelectedVoice(voice)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('users')
        .update({ voice_preference: voice } as any)
        .eq('id', user.id)
    } catch (error) {
      console.error('Error saving voice:', error)
    }
  }

  const playVoiceSample = async (voice: Voice) => {
    if (playingVoice) return
    setPlayingVoice(voice)
    try {
      const response = await fetch('/api/voice/sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice }),
      })
      if (response.ok) {
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        audio.onended = () => {
          setPlayingVoice(null)
          URL.revokeObjectURL(audioUrl)
        }
        audio.onerror = () => {
          setPlayingVoice(null)
          URL.revokeObjectURL(audioUrl)
        }
        await audio.play()
      }
    } catch (error) {
      console.error('Error playing voice sample:', error)
      setPlayingVoice(null)
    }
  }

  const changeEmail = async () => {
    if (!newEmail.trim()) {
      alert('Please enter a new email address')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error
      alert('Check your new email address for a confirmation link')
      setNewEmail('')
    } catch (error: any) {
      alert(error.message || 'Failed to change email')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (!newPassword || !confirmPassword) {
      alert('Please fill in all password fields')
      return
    }
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      alert('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      alert(error.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const exportData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all user data
      const [profile, conversations, memories, patterns] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('conversations').select('*').eq('user_id', user.id),
        supabase.from('memory_tags').select('*').eq('user_id', user.id),
        supabase.from('patterns').select('*').eq('user_id', user.id),
      ])

      const exportDataObj = {
        profile: profile.data,
        conversations: conversations.data,
        memories: memories.data,
        patterns: patterns.data,
        exportedAt: new Date().toISOString(),
      }

      const jsonString = JSON.stringify(exportDataObj, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const fileName = `passage-data-export-${new Date().toISOString().split('T')[0]}.json`

      // Try Web Share API first (for iOS/mobile)
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], fileName, { type: 'application/json' })
        
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Passage Data Export',
              text: 'Your Passage app data export',
            })
            // Successfully shared or user completed the share
            return
          } catch (shareError: any) {
            // If user cancelled the share sheet, do nothing
            if (shareError.name === 'AbortError') {
              console.log('User cancelled share')
              return
            }
            // For other errors, log but don't fall back
            console.error('Share failed:', shareError)
            return
          }
        }
      }

      // Fallback: regular download (only if Web Share API not supported)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data')
    }
  }

  const deleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Please type DELETE to confirm')
      return
    }
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Delete user data
      await supabase.from('users').delete().eq('id', user.id)
      
      // Sign out and redirect
      await supabase.auth.signOut()
      window.location.href = '/auth/signin'
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account')
    }
  }

  const clearMemories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('memory_tags').delete().eq('user_id', user.id)
      alert('All memories cleared')
      setShowClearMemoriesModal(false)
    } catch (error) {
      console.error('Error clearing memories:', error)
      alert('Failed to clear memories')
    }
  }

  const clearHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('conversations').delete().eq('user_id', user.id)
      alert('Conversation history cleared')
      setShowClearHistoryModal(false)
    } catch (error) {
      console.error('Error clearing history:', error)
      alert('Failed to clear history')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 py-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Settings
          </h1>
        </header>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
              Profile
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value as Country)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Entry Point
                </label>
                <select
                  value={entryPoint}
                  onChange={(e) => setEntryPoint(e.target.value as EntryPoint)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                >
                  {ENTRY_POINTS.map((ep) => (
                    <option key={ep.value} value={ep.value}>{ep.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={saveProfile}
                disabled={saving}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>

          {/* Voice Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">
              Voice
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Choose the voice for when I read responses aloud.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {VOICE_OPTIONS.map((voice) => (
                <button
                  key={voice.value}
                  onClick={() => handleVoiceChange(voice.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedVoice === voice.value
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-slate-900 dark:text-slate-50 text-sm">
                      {voice.label}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        playVoiceSample(voice.value)
                      }}
                      disabled={playingVoice !== null}
                      className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 text-slate-700 dark:text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Account Section */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
              Account
            </h2>
            
            <div className="space-y-6">
              {/* Change Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email Address
                </label>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Current: {email}
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                    placeholder="New email address"
                  />
                  <button
                    onClick={changeEmail}
                    disabled={saving || !newEmail}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Change Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Change Password
                </label>
                <div className="space-y-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                    placeholder="New password"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                    placeholder="Confirm new password"
                  />
                  <button
                    onClick={changePassword}
                    disabled={saving || !newPassword || !confirmPassword}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Change Password
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <button
                  onClick={exportData}
                  className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-50 border border-slate-300 dark:border-slate-600 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Export My Data
                </button>
              </div>

              <div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full py-2 px-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-2 border-red-200 dark:border-red-800 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
              Privacy
            </h2>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowClearMemoriesModal(true)}
                className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-50 border border-slate-300 dark:border-slate-600 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-left"
              >
                Clear All Memories
              </button>
              
              <button
                onClick={() => setShowClearHistoryModal(true)}
                className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-50 border border-slate-300 dark:border-slate-600 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-left"
              >
                Clear Conversation History
              </button>
            </div>
          </div>

          {/* Sign Out */}
          <div>
            <button
              onClick={async () => {
                if (confirm('Are you sure you want to sign out?')) {
                  await supabase.auth.signOut()
                  window.location.href = '/auth/signin'
                }
              }}
              className="w-full py-3 px-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-2 border-red-200 dark:border-red-800 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
              Delete Account
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              This will permanently delete your account and all data. This cannot be undone.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg mb-4 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
              placeholder="DELETE"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                }}
                className="flex-1 py-2 px-4 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-50 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                disabled={deleteConfirmText !== 'DELETE'}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Memories Modal */}
      {showClearMemoriesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
              Clear All Memories
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              This will permanently delete all your saved memories. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearMemoriesModal(false)}
                className="flex-1 py-2 px-4 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-50 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={clearMemories}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Clear Memories
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear History Modal */}
      {showClearHistoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
              Clear Conversation History
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              This will permanently delete all your conversations and messages. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearHistoryModal(false)}
                className="flex-1 py-2 px-4 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-50 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={clearHistory}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
