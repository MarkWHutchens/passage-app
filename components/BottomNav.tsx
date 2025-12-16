'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function BottomNav() {
  const pathname = usePathname()
  const [hasNewInsights, setHasNewInsights] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    checkForNewInsights()
  }, [])

  const checkForNewInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('users')
        .select('has_new_patterns')
        .eq('id', user.id)
        .single() as any

      setHasNewInsights(data?.has_new_patterns || false)
    } catch (error) {
      console.error('Error checking for new insights:', error)
    }
  }

  const navItems = [
    { href: '/home', icon: '🏠', label: 'Home' },
    { href: '/talk', icon: '💬', label: 'Talk' },
    { href: '/crisis', icon: '🆘', label: 'Crisis' },
    { href: '/patterns', icon: '🔍', label: 'Patterns' },
    { href: '/insights', icon: '💡', label: 'Insights', badge: hasNewInsights },
    { href: '/memories', icon: '🔖', label: 'Memories' },
    { href: '/settings', icon: '⚙️', label: 'Settings' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors relative ${
                  isActive
                    ? 'text-slate-900 dark:text-slate-50'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50'
                }`}
              >
                <span className="text-2xl relative">
                  {item.icon}
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
