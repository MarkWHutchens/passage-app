import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 py-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Passage
          </h1>
          <nav className="flex items-center gap-4">
            <Link
              href="/settings"
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
            >
              Settings
            </Link>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
              >
                Sign Out
              </button>
            </form>
          </nav>
        </header>

        {/* Welcome Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-slate-50">
            {isFirstVisit ? 'Welcome' : 'Welcome back'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {profile?.entry_point 
              ? `Supporting you through ${profile.entry_point}.`
              : 'Ready to support you through your journey.'
            }
          </p>
          <Link
            href="/talk?new=true"
            className="inline-block px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors dark:bg-slate-50 dark:text-slate-900"
          >
            Start Conversation
          </Link>
        </div>

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

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/memories"
            className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-50">
              Memories & Patterns
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              View your conversation history and discovered patterns
            </p>
          </Link>

          <Link
            href="/settings"
            className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-50">
              Settings
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Manage your account and preferences
            </p>
          </Link>
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
