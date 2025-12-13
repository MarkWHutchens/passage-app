import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    console.log('🔊 Generating speech for text length:', text.length)

    // Get user's preferred voice
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    let voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova' // Default
    
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('voice_preference')
        .eq('id', user.id)
        .single() as any

      if (data?.voice_preference) {
        voice = data.voice_preference
        console.log('🎙️ Using preferred voice:', voice)
      }
    }

    // Generate speech (non-streaming to maintain user interaction context)
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: text,
      response_format: 'mp3',
    })

    // Convert to buffer for reliable playback
    const buffer = Buffer.from(await response.arrayBuffer())

    console.log('✅ Speech generated successfully')

    // Return the audio as a complete response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error generating speech:', error)
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    )
  }
}
