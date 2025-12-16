import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('users')
        .select('onboarding_complete')
        .eq('id', data.user.id)
        .single() as any
      
      // Redirect to onboarding if not completed, otherwise to home
      const destination = profile?.onboarding_complete ? '/home' : '/onboard'
      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  // If no code or error, redirect to error page
  return NextResponse.redirect(`${origin}/auth/signin?error=auth`)
}
