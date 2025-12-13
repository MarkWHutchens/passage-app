'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const VOICE_OPTIONS = [
  { value: 'nova', label: 'Nova (warm, female)' },
  { value: 'shimmer', label: 'Shimmer (soft, female)' },
  { value: 'alloy', label: 'Alloy (neutral)' },
  { value: 'echo', label: 'Echo (male)' },
  { value: 'fable', label: 'Fable (British, expressive)' },
  { value: 'onyx', label: 'Onyx (deep, male)' },
]

export default function SettingsPage() {
  const [selectedVoice, setSelectedVoice] = useState('nova')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadUserSettings()
  }, [])

  const loadUserSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('users')
        .select('voice_preference')
        .eq('id', user.id)
        .single() as any

      if (data?.voice_preference) {
        setSelectedVoice(data.voice_preference)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVoiceChange = async (voice: string) => {
    setSelectedVoice(voice)
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('users')
        .update({ voice_preference: voice } as any)
        .eq('id', user.id)

      if (error) {
        console.error('Error saving voice preference:', error)
        alert('Failed to save voice preference')
      }
    } catch (error) {
      console.error('Error saving voice preference:', error)
      alert('Failed to save voice preference')
    } finally {
      setSaving(false)
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
          {/* Voice Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
              Voice Settings
            </h2>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Voice Selection
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Choose the voice for AI responses when voice mode is enabled
              </p>
              
              <select
                value={selectedVoice}
                onChange={(e) => handleVoiceChange(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 disabled:opacity-50"
              >
                {VOICE_OPTIONS.map((voice) => (
                  <option key={voice.value} value={voice.value}>
                    {voice.label}
                  </option>
                ))}
              </select>
              
              {saving && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Saving preference...
                </p>
              )}
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
              Account
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Additional account settings coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
