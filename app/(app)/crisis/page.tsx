'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { CrisisResource, CrisisContact } from '@/types'

interface CountryOption {
  country_code: string
  country_name: string
}

const COUNTRY_CODE_MAP: Record<string, string> = {
  'australia': 'AU',
  'united-states': 'US',
  'united-kingdom': 'UK',
  'canada': 'CA',
  'new-zealand': 'NZ',
  'ireland': 'IE',
}

const CATEGORY_LABELS: Record<string, string> = {
  mental_health: 'Mental Health Crisis Support',
  young_people: 'Support for Young People',
  domestic_violence: 'Domestic Violence Support',
  sexual_assault: 'Sexual Assault Support',
  addiction: 'Addiction & Substance Use',
  lgbtiq: 'LGBTIQ+ Support'
}

export default function CrisisPage() {
  const [resource, setResource] = useState<CrisisResource | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCountrySelector, setShowCountrySelector] = useState(false)
  const [countries, setCountries] = useState<CountryOption[]>([])
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('')
  const [notFound, setNotFound] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadCrisisResources()
    loadCountries()
  }, [])

  const loadCountries = async () => {
    try {
      const response = await fetch('/api/crisis-resources', {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        setCountries(data)
      }
    } catch (error) {
      console.error('Error loading countries:', error)
    }
  }

  const loadCrisisResources = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      let countryCode = ''

      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('country')
          .eq('id', user.id)
          .single() as { data: { country?: string } | null }

        if (profile?.country) {
          // Try to map from lowercase format first
          if (COUNTRY_CODE_MAP[profile.country]) {
            countryCode = COUNTRY_CODE_MAP[profile.country]
          } else {
            // Try to lookup by country name in database
            const { data: resourceByName } = await supabase
              .from('crisis_resources')
              .select('country_code')
              .ilike('country_name', profile.country)
              .single() as { data: { country_code: string } | null }
            
            if (resourceByName) {
              countryCode = resourceByName.country_code
            } else {
              // No match found, show selector
              setShowCountrySelector(true)
              setLoading(false)
              return
            }
          }
        } else {
          // No country set, show selector
          setShowCountrySelector(true)
          setLoading(false)
          return
        }
      } else {
        setShowCountrySelector(true)
        setLoading(false)
        return
      }

      setSelectedCountryCode(countryCode)
      await fetchResourcesByCountry(countryCode)
    } catch (error) {
      console.error('Error loading crisis resources:', error)
      setLoading(false)
    }
  }

  const fetchResourcesByCountry = async (countryCode: string) => {
    try {
      const response = await fetch(`/api/crisis-resources?country=${countryCode}`)
      if (response.ok) {
        const data = await response.json()
        setResource(data)
        setNotFound(false)
      } else {
        setNotFound(true)
      }
    } catch (error) {
      console.error('Error fetching resources:', error)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const handleCountrySelect = async (countryCode: string) => {
    setLoading(true)
    setSelectedCountryCode(countryCode)
    await fetchResourcesByCountry(countryCode)
    setShowCountrySelector(false)

    // Update user profile if logged in
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const reverseMap = Object.fromEntries(
        Object.entries(COUNTRY_CODE_MAP).map(([k, v]) => [v, k])
      )
      const countryValue = reverseMap[countryCode] || 'other'
      
      // Update user country
      try {
        // @ts-ignore - Supabase type limitation
        await supabase.from('users').update({ country: countryValue }).eq('id', user.id)
      } catch (error) {
        console.error('Error updating country:', error)
      }
    }
  }

  const renderContact = (contact: CrisisContact) => (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
      <h4 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">{contact.name}</h4>
      {contact.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{contact.description}</p>
      )}
      <div className="space-y-2 text-sm">
        {contact.phone && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-slate-700 dark:text-slate-300">Call: </span>
            <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="font-semibold text-red-600 dark:text-red-400 hover:underline">
              {contact.phone}
            </a>
          </div>
        )}
        {contact.text && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="text-slate-700 dark:text-slate-300">Text: </span>
            <span className="font-semibold text-slate-900 dark:text-slate-50">{contact.text}</span>
          </div>
        )}
        {contact.email && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-slate-700 dark:text-slate-300">Email: </span>
            <a href={`mailto:${contact.email}`} className="font-semibold text-red-600 dark:text-red-400 hover:underline">
              {contact.email}
            </a>
          </div>
        )}
        {contact.website && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <a href={`https://${contact.website}`} target="_blank" rel="noopener noreferrer" className="text-red-600 dark:text-red-400 hover:underline">
              {contact.website}
            </a>
          </div>
        )}
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{contact.hours}</span>
        </div>
        {contact.languages && (
          <div className="text-xs text-slate-600 dark:text-slate-400 italic">
            {contact.languages}
          </div>
        )}
        {contact.spanish && (
          <div className="text-xs text-slate-600 dark:text-slate-400 italic">
            Spanish: {contact.spanish}
          </div>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/home" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Crisis Support
          </h1>
          <button
            onClick={() => setShowCountrySelector(true)}
            className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
          >
            Change
          </button>
        </div>
      </header>

      {/* Country Selector Modal */}
      {showCountrySelector && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">
              Select Your Country
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Choose your country to see relevant crisis support resources.
            </p>
            <div className="space-y-2">
              {countries.map((country) => (
                <button
                  key={country.country_code}
                  onClick={() => handleCountrySelect(country.country_code)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="text-slate-900 dark:text-slate-50">
                    {country.country_name}
                  </span>
                </button>
              ))}
            </div>
            {selectedCountryCode && (
              <button
                onClick={() => setShowCountrySelector(false)}
                className="mt-4 w-full px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Crisis Resources Content */}
      {notFound ? (
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-6 text-center">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-3">
              Crisis resources for your country coming soon
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              We're working to add resources for more countries. In the meantime, you can find international crisis support at:
            </p>
            <a
              href="https://findahelpline.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              Find a Helpline →
            </a>
          </div>
        </div>
      ) : resource && (
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Emergency Header */}
            <div className="bg-red-500 text-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <div>
                  <h2 className="text-2xl font-bold">{resource.country_name}</h2>
                  <p className="text-red-50">You are not alone. Help is available 24/7.</p>
                </div>
              </div>
              <div className="bg-red-600 rounded-lg p-4">
                <div className="text-sm text-red-100 mb-1">Emergency Services</div>
                <a href={`tel:${resource.emergency_number}`} className="text-3xl font-bold hover:underline">
                  {resource.emergency_number}
                </a>
                {resource.nhs_mental_health && (
                  <div className="mt-2 text-sm text-red-100">
                    Mental Health Crisis: {resource.nhs_mental_health}
                  </div>
                )}
              </div>
            </div>

            {/* Primary Crisis Line */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-red-50 dark:bg-red-900/20">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                Primary Crisis Line
              </h3>
              {renderContact(resource.primary_crisis_line)}
            </div>

            {/* Categorized Resources */}
            <div className="p-6 space-y-6">
              {Object.entries(resource.resources).map(([category, contacts]) => (
                contacts && contacts.length > 0 && (
                  <div key={category}>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-3">
                      {CATEGORY_LABELS[category] || category}
                    </h3>
                    <div className="space-y-3">
                      {contacts.map((contact: CrisisContact, idx: number) => (
                        <div key={idx}>
                          {renderContact(contact)}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
