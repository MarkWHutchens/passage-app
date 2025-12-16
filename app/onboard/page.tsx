'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { EntryPoint, Country } from '@/types'

const ENTRY_POINTS: { value: EntryPoint; label: string; description: string }[] = [
  { value: 'burnout', label: 'Burnout', description: 'Recovery from work-related exhaustion' },
  { value: 'grief', label: 'Grief & Loss', description: 'Navigating loss of any kind' },
  { value: 'divorce', label: 'Divorce/Separation', description: 'Life after relationship end' },
  { value: 'addiction', label: 'Addiction Recovery', description: 'Support in recovery journey' },
  { value: 'career', label: 'Career Crisis', description: 'Career transitions and uncertainty' },
  { value: 'illness', label: 'Illness Recovery', description: 'Healing from physical illness' },
  { value: 'transition', label: 'Life Transition', description: 'Major life changes' },
  { value: 'other', label: 'Other', description: 'Something else you\'re navigating' },
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

type Voice = 'alloy' | 'echo' | 'fable' | 'nova' | 'onyx' | 'shimmer'

const VOICES: { value: Voice; label: string; description: string }[] = [
  { value: 'alloy', label: 'Alloy', description: 'Neutral and balanced' },
  { value: 'echo', label: 'Echo', description: 'Warm and friendly' },
  { value: 'fable', label: 'Fable', description: 'Calm and reassuring' },
  { value: 'nova', label: 'Nova', description: 'Bright and clear' },
  { value: 'onyx', label: 'Onyx', description: 'Deep and grounding' },
  { value: 'shimmer', label: 'Shimmer', description: 'Soft and gentle' },
]

export default function OnboardPage() {
  const [selectedEntry, setSelectedEntry] = useState<EntryPoint | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null)
  const [step, setStep] = useState<'entry' | 'country' | 'voice' | 'name'>('entry')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [playingVoice, setPlayingVoice] = useState<Voice | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleEntryNext = () => {
    if (!selectedEntry) return
    setStep('country')
  }

  const handleCountryNext = () => {
    if (!selectedCountry) return
    setStep('voice')
  }

  const handleVoiceNext = () => {
    if (!selectedVoice) return
    setStep('name')
  }

  const playVoiceSample = async (voice: Voice) => {
    if (playingVoice) return // Prevent playing multiple at once
    
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

  const handleComplete = async () => {
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        console.log('=== SAVING PROFILE ===')
        console.log('Name entered:', name)
        console.log('Name to save:', name.trim() || null)
        console.log('Entry point:', selectedEntry)
        console.log('Country:', selectedCountry)
        console.log('Voice:', selectedVoice)
        console.log('User ID:', user.id)
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            entry_point: selectedEntry,
            name: name.trim() || null,
            country: selectedCountry,
            voice_preference: selectedVoice,
            onboarding_complete: true
          } as any)
          .eq('id', user.id)
        
        console.log('Update result:', updateError ? 'Error' : 'Success')
        console.log('===================')
        
        if (updateError) {
          console.error('Error updating profile:', updateError)
          setLoading(false)
          return
        }
      }

      // Wait a moment to ensure database update propagates
      await new Promise(resolve => setTimeout(resolve, 500))
      
      router.push('/home')
    } catch (error) {
      console.error('Error saving profile:', error)
      setLoading(false)
    }
  }

  if (step === 'country') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
            <button
              onClick={() => setStep('entry')}
              className="mb-4 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
            >
              ← Back
            </button>
            
            <h1 className="text-3xl font-bold text-center mb-4 text-slate-900 dark:text-slate-50">
              Where are you located?
            </h1>
            <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
              This helps us show you relevant crisis support resources if you need them.
            </p>

            <div className="mb-8">
              <select
                value={selectedCountry || ''}
                onChange={(e) => setSelectedCountry(e.target.value as Country)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                autoFocus
              >
                <option value="">Select your country</option>
                {COUNTRIES.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCountryNext}
              disabled={!selectedCountry || loading}
              className="w-full py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-50 dark:text-slate-900"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'voice') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-2xl">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
            <button
              onClick={() => setStep('country')}
              className="mb-4 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
            >
              ← Back
            </button>
            
            <h1 className="text-3xl font-bold text-center mb-4 text-slate-900 dark:text-slate-50">
              How would you like me to sound?
            </h1>
            <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
              Choose a voice for when I read responses aloud. Tap the play button to hear a sample.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {VOICES.map((voice) => (
                <button
                  key={voice.value}
                  onClick={() => setSelectedVoice(voice.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedVoice === voice.value
                      ? 'border-slate-900 bg-slate-50 dark:border-slate-50 dark:bg-slate-700'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-slate-900 dark:text-slate-50">
                      {voice.label}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        playVoiceSample(voice.value)
                      }}
                      disabled={playingVoice !== null}
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

            <button
              onClick={handleVoiceNext}
              disabled={!selectedVoice || loading}
              className="w-full py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-50 dark:text-slate-900"
            >
              Continue
            </button>

            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400 text-center">
              You can change this later in settings
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'name') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
            <button
              onClick={() => setStep('voice')}
              className="mb-4 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
            >
              ← Back
            </button>
            
            <h1 className="text-3xl font-bold text-center mb-4 text-slate-900 dark:text-slate-50">
              What should I call you?
            </h1>
            <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
              I'd love to know your name so our conversations feel more personal. You can skip this if you prefer.
            </p>

            <div className="mb-8">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 placeholder-slate-400"
                maxLength={50}
                autoFocus
              />
            </div>

            <button
              onClick={handleComplete}
              disabled={loading}
              className="w-full py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-50 dark:text-slate-900"
            >
              {loading ? 'Getting started...' : 'Complete Setup'}
            </button>

            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400 text-center">
              You can update this anytime in settings
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-3xl">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-4 text-slate-900 dark:text-slate-50">
            What brings you to Passage?
          </h1>
          <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
            This helps me understand what you're navigating and provide better support.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {ENTRY_POINTS.map((entry) => (
              <button
                key={entry.value}
                onClick={() => setSelectedEntry(entry.value)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedEntry === entry.value
                    ? 'border-slate-900 bg-slate-50 dark:border-slate-50 dark:bg-slate-700'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                }`}
              >
                <div className="font-semibold text-slate-900 dark:text-slate-50 mb-1">
                  {entry.label}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {entry.description}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleEntryNext}
            disabled={!selectedEntry || loading}
            className="w-full py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-50 dark:text-slate-900"
          >
            Continue
          </button>

          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400 text-center">
            You can change this later in settings
          </p>
        </div>
      </div>
    </div>
  )
}
