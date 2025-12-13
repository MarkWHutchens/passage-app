import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { patterns, singlePattern, saveToHistory } = await request.json()

    // Get user profile for context
    const { data: profile } = await supabase
      .from('users')
      .select('entry_point, email')
      .eq('id', user.id)
      .single() as any

    if (singlePattern) {
      // Generate insights for a single pattern
      const response = await anthropic.messages.create({
        model: process.env.CLAUDE_HAIKU_MODEL || 'claude-3-5-haiku-20241022',
        max_tokens: 500,
        system: `You are Passage, a warm and supportive AI companion. The user is navigating ${profile?.entry_point || 'a life transition'}.

Provide a brief, empathetic comment on this specific pattern. Keep it:
- Warm and non-judgmental
- 2-3 sentences max
- Focused on validation and understanding
- NOT prescriptive or clinical
- Conversational tone

Just provide the text directly, no extra formatting.`,
        messages: [{
          role: 'user',
          content: `Pattern: ${singlePattern.description}\nType: ${singlePattern.pattern_type}\nOccurrences: ${singlePattern.occurrence_count}\n\nProvide a brief, warm observation about this pattern.`
        }]
      })

      const content = response.content[0]
      if (content.type === 'text') {
        return NextResponse.json({ insight: content.text.trim() })
      }
    } else if (patterns && patterns.length > 0) {
      // Fetch most recent previous insight for comparison
      const { data: previousInsights } = await supabase
        .from('insights')
        .select('patterns_snapshot, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1) as any

      const previousPatterns = previousInsights?.[0]?.patterns_snapshot || null
      const isFirstInsight = !previousPatterns

      // Generate overall insights connecting multiple patterns
      const currentPatternsSummary = patterns.map((p: any) => 
        `- ${p.description} (${p.pattern_type}, ${p.occurrence_count} occurrences)`
      ).join('\n')

      let userMessage = ''
      
      if (isFirstInsight) {
        userMessage = `Here are the detected patterns:\n\n${currentPatternsSummary}\n\nThis is the user's first pattern analysis. Provide a warm, thoughtful synthesis connecting these patterns and offering gentle insights.`
      } else {
        const previousPatternsSummary = previousPatterns.map((p: any) =>
          `- ${p.description} (${p.pattern_type}, ${p.occurrence_count} occurrences)`
        ).join('\n')
        
        userMessage = `CURRENT PATTERNS (just detected):\n${currentPatternsSummary}\n\nPREVIOUS PATTERNS (from last analysis on ${new Date(previousInsights[0].created_at).toLocaleDateString()}):\n${previousPatternsSummary}\n\nCompare these patterns and provide insights about what's changed.`
      }

      const systemPrompt = isFirstInsight
        ? `You are Passage, a warm and supportive AI companion for people navigating ${profile?.entry_point || 'life transitions'}.

You're reviewing patterns detected in the user's conversations for the first time. Provide a brief synthesis that:
1. Connects the patterns together - how do they relate?
2. Offers a gentle, non-judgmental observation about what they might reveal
3. Suggests 1-2 things to explore or discuss with a therapist

Keep the tone:
- Warm and compassionate, like a wise friend
- Non-clinical (avoid therapy-speak)
- Validating and supportive
- Brief (3-4 short paragraphs max)

Just provide the text directly, no extra formatting or headers.`
        : `You are Passage, a warm and supportive AI companion for people navigating ${profile?.entry_point || 'life transitions'}.

You're comparing current patterns to previous patterns from an earlier analysis. Generate an insight summary that:

- Notes what's NEW (patterns not seen before) - use "I'm noticing something new..."
- Notes what's STRENGTHENING (higher occurrence count than before) - acknowledge the pattern
- Notes what's FADING (lower count or no longer present) - be encouraging if positive
- Notes any PROGRESS (positive changes) - use "There's real progress here..."
- Be encouraging about positive shifts while gentle about persistent challenges
- Use phrases like "What remains consistent is..." for ongoing patterns

Keep the tone:
- Warm and conversational, like a wise friend checking in
- Non-clinical (avoid therapy-speak)
- Validating and supportive
- Brief (3-4 short paragraphs max)
- Focus on the journey and growth, not just listing changes

Just provide the text directly, no extra formatting or headers.`

      const response = await anthropic.messages.create({
        model: process.env.CLAUDE_SONNET_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userMessage
        }]
      })

      const content = response.content[0]
      if (content.type === 'text') {
        const summaryText = content.text.trim()
        
        // Save to insights table if requested
        if (saveToHistory) {
          console.log('=== SAVING INSIGHT ===')
          console.log('User ID:', user.id)
          console.log('Pattern count:', patterns.length)
          console.log('Content length:', summaryText.length)
          
          const { data: savedInsight, error: saveError } = await supabase
            .from('insights')
            .insert({
              user_id: user.id,
              content: summaryText,
              pattern_count: patterns.length,
              patterns_snapshot: patterns,
              viewed: false
            } as any)
            .select()
          
          if (saveError) {
            console.error('❌ Save error:', saveError)
            console.error('Error details:', JSON.stringify(saveError, null, 2))
          } else {
            console.log('✅ Insight saved successfully!')
            console.log('Saved insight:', savedInsight)
          }
        } else {
          console.log('⚠️ saveToHistory is false, not saving to database')
        }
        
        return NextResponse.json({ summary: summaryText })
      }
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error generating pattern insights:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}
