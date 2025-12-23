import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's analysis tracking data
    const { data: profile } = await supabase
      .from('users')
      .select('conversation_count_at_last_analysis')
      .eq('id', user.id)
      .single() as any

    // Count current conversations
    const { count: currentConversationCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id) as any

    const lastAnalysisCount = profile?.conversation_count_at_last_analysis || 0
    const conversationsSinceLastAnalysis = (currentConversationCount || 0) - lastAnalysisCount

    // Only analyze if 3+ new conversations
    if (conversationsSinceLastAnalysis < 3) {
      return NextResponse.json({ 
        skipped: true, 
        reason: 'Not enough new conversations',
        conversationsSinceLastAnalysis 
      })
    }

    // Call the pattern detection endpoint
    const detectResponse = await fetch(`${request.nextUrl.origin}/api/patterns/detect`, {
      method: 'POST',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    })

    if (!detectResponse.ok) {
      throw new Error('Pattern detection failed')
    }

    const detectData = await detectResponse.json()

    // Update tracking fields
    await (supabase as any)
      .from('users')
      .update({
        last_pattern_analysis: new Date().toISOString(),
        conversation_count_at_last_analysis: currentConversationCount,
      })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      patternsDetected: detectData.patterns?.length || 0,
      conversationsSinceLastAnalysis
    })
  } catch (error) {
    console.error('Background pattern analysis error:', error)
    return NextResponse.json(
      { error: 'Pattern analysis failed' },
      { status: 500 }
    )
  }
}
