import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SAMPLE_TEXT = "Hi, I'm here to listen. How are you doing today?"

export async function POST(request: Request) {
  try {
    const { voice } = await request.json()

    if (!voice) {
      return NextResponse.json({ error: 'Voice is required' }, { status: 400 })
    }

    // Validate voice
    const validVoices = ['alloy', 'echo', 'fable', 'nova', 'onyx', 'shimmer']
    if (!validVoices.includes(voice)) {
      return NextResponse.json({ error: 'Invalid voice' }, { status: 400 })
    }

    console.log('🔊 Generating voice sample for:', voice)

    // Generate speech sample
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice as 'alloy' | 'echo' | 'fable' | 'nova' | 'onyx' | 'shimmer',
      input: SAMPLE_TEXT,
      response_format: 'mp3',
    })

    const buffer = Buffer.from(await response.arrayBuffer())

    console.log('✅ Voice sample generated successfully')

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Error generating voice sample:', error)
    return NextResponse.json(
      { error: 'Failed to generate voice sample' },
      { status: 500 }
    )
  }
}
