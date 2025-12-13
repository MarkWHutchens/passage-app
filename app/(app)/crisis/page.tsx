'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import CrisisResources from '@/components/CrisisResources'
import { Country } from '@/types'

export default function CrisisPage() {
  const [country, setCountry] = useState<Country>('other')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadCountry() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('country')
          .eq('id', user.id)
          .single() as any

        if (profile?.country) {
          setCountry(profile.country)
        }
      }
      setLoading(false)
    }

    loadCountry()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/home" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Crisis Support
          </h1>
          <div className="w-16"></div>
        </div>
      </header>

      {/* Crisis Resources */}
      <div className="py-6">
        <CrisisResources country={country} />
      </div>
    </div>
  )
}
