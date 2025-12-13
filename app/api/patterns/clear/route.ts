import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete all patterns for this user
    const { error } = await supabase
      .from('patterns')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Error clearing patterns:', error)
      return NextResponse.json({ error: 'Failed to clear patterns' }, { status: 500 })
    }

    console.log('✅ All patterns cleared for user:', user.id)
    return NextResponse.json({ message: 'Patterns cleared successfully' })
  } catch (error) {
    console.error('Error clearing patterns:', error)
    return NextResponse.json(
      { error: 'Failed to clear patterns' },
      { status: 500 }
    )
  }
}
