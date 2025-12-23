'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface WelcomeSectionProps {
  name?: string | null
  entryPoint?: string | null
  isFirstVisit: boolean
}

function getGreeting(): string {
  const hour = new Date().getHours() // Uses browser's local time
  
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 21) return 'Good evening'
  return 'Hi' // 9pm - 5am
}

export default function WelcomeSection({ name, entryPoint, isFirstVisit }: WelcomeSectionProps) {
  const [greeting, setGreeting] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setGreeting(getGreeting())
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by showing placeholder until mounted
  if (!mounted) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-slate-50">
          Welcome{name && `, ${name}`}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          {entryPoint 
            ? `Supporting you through ${entryPoint}.`
            : 'Ready to support you through your journey.'
          }
        </p>
        <Link
          href="/talk?new=true"
          className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
        >
          Start Conversation
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 mb-8 text-center">
      <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-slate-50">
        {greeting}{name && `, ${name}`}
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        {entryPoint 
          ? `Supporting you through ${entryPoint}.`
          : 'Ready to support you through your journey.'
        }
      </p>
      <Link
        href="/talk?new=true"
        className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
      >
        Start Conversation
      </Link>
    </div>
  )
}
