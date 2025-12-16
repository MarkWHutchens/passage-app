'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Voice = 'alloy' | 'echo' | 'fable' | 'nova' | 'onyx' | 'shimmer'

const VOICE_OPTIONS: { value: Voice; label: string; description: string }[] = [
  { value: 'alloy', label: 'Alloy', description: 'Neutral and balanced' },
  { value: 'echo', label: 'Echo', description: 'Warm and friendly' },
  { value: 'fable', label: 'Fable', description: 'Calm and reassuring' },
  { value: 'nova', label: 'Nova', description: 'Bright and clear' },
  { value: 'onyx', label: 'Onyx', description: 'Deep and grounding' },
  { value: 'shimmer', label: 'Shimmer', description: 'Soft and gentle' },
]

export default function SettingsPage() {
  const [selectedVoice, setSelectedVoice] = useState<Voice>('nova')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [playingVoice, setPlayingVoice] = useState<Voice | null>(null)
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

  const handleVoiceChange = async (voice: Voice) => {
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
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
              Voice Settings
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Choose the voice for when I read responses aloud. Tap the play button to hear a sample.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {VOICE_OPTIONS.map((voice) => (
                <button
                  key={voice.value}
                  onClick={() => handleVoiceChange(voice.value)}
                  disabled={saving}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedVoice === voice.value
                      ? 'border-slate-900 bg-slate-50 dark:border-slate-50 dark:bg-slate-700'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                  } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-slate-900 dark:text-slate-50">
                      {voice.label}
                      {selectedVoice === voice.value && (
                        <span className="ml-2 text-xs bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 px-2 py-1 rounded">
                          Selected
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        playVoiceSample(voice.value)
                      }}
                      disabled={playingVoice !== null || saving}
                      className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                    >
                      {playingVoice === voice.value ? (
                        <svg className="w-5 h-5 text-slate-700 dark:text-slate-300 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-slate-700 dark:text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {voice.description}
                  </div>
                </button>
              ))}
            </div>
            
            {saving && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 text-center">
                Saving preference...
              </p>
            )}
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
