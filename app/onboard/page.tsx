'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { EntryPoint, Country } from '@/types'
import { Flame, Heart, UserMinus, Leaf, Briefcase, Activity, ArrowRightLeft, HelpCircle } from 'lucide-react'

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

  const getEntryIcon = (entryValue: EntryPoint) => {
    const iconProps = { size: 20, className: 'text-slate-600 dark:text-slate-400' }
    switch (entryValue) {
      case 'burnout': return <Flame {...iconProps} />
      case 'grief': return <Heart {...iconProps} />
      case 'divorce': return <UserMinus {...iconProps} />
      case 'addiction': return <Leaf {...iconProps} />
      case 'career': return <Briefcase {...iconProps} />
      case 'illness': return <Activity {...iconProps} />
      case 'transition': return <ArrowRightLeft {...iconProps} />
      case 'other': return <HelpCircle {...iconProps} />
      default: return null
    }
  }

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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth/signin')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleComplete = async () => {
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('❌ No user found')
        alert('Session expired. Please sign in again.')
        setLoading(false)
        return
      }

      console.log('=== SAVING PROFILE ===')
      console.log('Name entered:', name)
      console.log('Name to save:', name.trim() || null)
      console.log('Entry point:', selectedEntry)
      console.log('Country:', selectedCountry)
      console.log('Voice:', selectedVoice)
      console.log('User ID:', user.id)
      
      const { data: updateData, error: updateError } = await (supabase as any)
        .from('users')
        .update({ 
          entry_point: selectedEntry,
          name: name.trim() || null,
          country: selectedCountry,
          voice_preference: selectedVoice,
          onboarding_complete: true
        })
        .eq('id', user.id)
        .select()
      
      console.log('Update result:', updateError ? 'Error' : 'Success')
      console.log('Update data:', updateData)
      console.log('Update error:', updateError)
      
      if (updateError) {
        console.error('❌ Error updating profile:', updateError)
        alert(`Failed to save profile: ${updateError.message}`)
        setLoading(false)
        return
      }

      console.log('✅ Profile saved successfully')
      
      // Verify the update was successful
      const { data: verifyData, error: verifyError } = await supabase
        .from('users')
        .select('onboarding_complete')
        .eq('id', user.id)
        .single() as any
      
      console.log('Verification check - onboarding_complete:', verifyData?.onboarding_complete)
      
      if (verifyError || !verifyData?.onboarding_complete) {
        console.error('❌ Verification failed:', verifyError)
        alert('Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      console.log('✅ Verification successful, redirecting to /home')
      console.log('===================')
      
      // Wait a moment to ensure database update propagates
      await new Promise(resolve => setTimeout(resolve, 500))
      
      router.push('/home')
      router.refresh() // Force a refresh to reload the layout
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      alert('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (step === 'country') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
        <button
          onClick={handleSignOut}
          className="fixed top-4 right-4 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          Sign out
        </button>
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
        <button
          onClick={handleSignOut}
          className="fixed top-4 right-4 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          Sign out
        </button>
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
        <button
          onClick={handleSignOut}
          className="fixed top-4 right-4 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          Sign out
        </button>
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
      <button
        onClick={handleSignOut}
        className="fixed top-4 right-4 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
      >
        Sign out
      </button>
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
                <div className="flex items-center gap-3 mb-2">
                  {getEntryIcon(entry.value)}
                  <div className="font-semibold text-slate-900 dark:text-slate-50">
                    {entry.label}
                  </div>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 ml-8">
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
