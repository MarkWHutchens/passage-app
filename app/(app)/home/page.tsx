import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import WelcomeSection from '@/components/WelcomeSection'

export default async function HomePage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user?.id!)
    .single() as any

  // Check if user has any conversations (to determine if first-time user)
  const { count: conversationCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id!) as any
  
  const isFirstVisit = conversationCount === 0

  // Get patterns count
  const { count: patternsCount } = await supabase
    .from('patterns')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id!)
    .eq('is_active', true) as any

  // Calculate days active
  const createdAt = new Date(profile?.created_at || user?.created_at)
  const now = new Date()
  const daysActive = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 py-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Passage
          </h1>
        </header>

        {/* Welcome Section */}
        <WelcomeSection
          name={profile?.name}
          entryPoint={profile?.entry_point}
          isFirstVisit={isFirstVisit}
        />

        {/* Crisis Support Banner */}
        <div className="mb-8">
          <Link
            href="/crisis"
            className="block bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-6 hover:border-red-300 dark:hover:border-red-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-red-900 dark:text-red-100">
                  Crisis Support Available 24/7
                </h3>
                <p className="text-red-700 dark:text-red-300 text-sm">
                  If you're in crisis, immediate help is available. View crisis resources →
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Progress Indicators */}
        <div className="mb-8">
          {conversationCount === 0 ? (
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Start your first conversation to begin your journey
              </p>
            </div>
          ) : (
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Your Activity</p>
              <div className="flex items-center gap-4 text-sm text-slate-700 dark:text-slate-300">
                <span>{conversationCount} conversation{conversationCount !== 1 ? 's' : ''}</span>
                <span className="text-slate-400">•</span>
                <span>{patternsCount || 0} pattern{patternsCount !== 1 ? 's' : ''} noticed</span>
                <span className="text-slate-400">•</span>
                <span>Member for {daysActive} day{daysActive !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </div>

        {/* Subscription Status */}
        {profile?.subscription_status === 'trial' && (
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              You're on a free trial. 
              {profile.trial_ends_at && ` Ends ${new Date(profile.trial_ends_at).toLocaleDateString()}.`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
