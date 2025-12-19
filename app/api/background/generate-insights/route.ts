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

    // Get user's last insight generation timestamp
    const { data: profile } = await supabase
      .from('users')
      .select('last_insight_generation, last_pattern_analysis')
      .eq('id', user.id)
      .single() as any

    const lastInsightGeneration = profile?.last_insight_generation
    const lastPatternAnalysis = profile?.last_pattern_analysis

    // Check if we should generate insights
    let shouldGenerate = false
    let reason = ''

    // Check 1: Has it been 7+ days since last insight?
    if (lastInsightGeneration) {
      const daysSinceLastInsight = (Date.now() - new Date(lastInsightGeneration).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceLastInsight >= 7) {
        shouldGenerate = true
        reason = 'Weekly insight generation'
      }
    } else {
      // Never generated insights before
      shouldGenerate = true
      reason = 'First insight generation'
    }

    // Check 2: Have new patterns been detected since last insight?
    if (!shouldGenerate && lastPatternAnalysis && lastInsightGeneration) {
      if (new Date(lastPatternAnalysis) > new Date(lastInsightGeneration)) {
        shouldGenerate = true
        reason = 'New patterns detected'
      }
    } else if (!shouldGenerate && lastPatternAnalysis && !lastInsightGeneration) {
      shouldGenerate = true
      reason = 'Patterns exist but no insights yet'
    }

    if (!shouldGenerate) {
      return NextResponse.json({ 
        skipped: true, 
        reason: 'No trigger conditions met' 
      })
    }

    // Get active patterns
    const { data: patterns } = await supabase
      .from('patterns')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('occurrence_count', { ascending: false }) as any

    if (!patterns || patterns.length === 0) {
      return NextResponse.json({ 
        skipped: true, 
        reason: 'No patterns to analyze' 
      })
    }

    // Generate insights
    const insightsResponse = await fetch(`${request.nextUrl.origin}/api/patterns/insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify({ 
        patterns: patterns,
        saveToHistory: true
      })
    })

    if (!insightsResponse.ok) {
      throw new Error('Insight generation failed')
    }

    const insightsData = await insightsResponse.json()

    // Update tracking field and set has_new_patterns flag
    await supabase
      .from('users')
      .update({
        last_insight_generation: new Date().toISOString(),
        has_new_patterns: true,
      } as any)
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      reason,
      patternCount: patterns.length,
      insightGenerated: !!insightsData.summary
    })
  } catch (error) {
    console.error('Background insight generation error:', error)
    return NextResponse.json(
      { error: 'Insight generation failed' },
      { status: 500 }
    )
  }
}
