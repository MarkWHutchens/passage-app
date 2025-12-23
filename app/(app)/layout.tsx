import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Check if user has completed onboarding
  console.log('🔍 Layout: Checking onboarding for user:', user.id)
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('onboarding_complete')
    .eq('id', user.id)
    .single() as any

  console.log('🔍 Layout: Profile data:', profile)
  console.log('🔍 Layout: Profile error:', profileError)
  console.log('🔍 Layout: onboarding_complete =', profile?.onboarding_complete)

  // Redirect to onboarding if not completed
  if (!profile?.onboarding_complete) {
    console.log('❌ Layout: Redirecting to onboarding (onboarding_complete is false/null)')
    redirect('/onboard')
  }
  
  console.log('✅ Layout: Onboarding complete, allowing access')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Crisis Icon - Always Visible */}
      <div className="fixed top-4 right-4 z-50">
        <Link
          href="/crisis"
          className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-2 py-1.5 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-lg shadow-md hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
          title="Crisis Support"
        >
          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-xs font-medium text-red-600 dark:text-red-400 mt-0.5">Help</span>
        </Link>
      </div>
      
      <div className="pb-20">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
