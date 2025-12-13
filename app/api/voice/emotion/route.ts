import { NextResponse } from 'next/server'
import WebSocket from 'ws'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    console.log('🎭 Analyzing emotions with Hume AI Streaming...')
    console.log('Audio file type:', audioFile.type)
    console.log('Audio file size:', audioFile.size, 'bytes')

    if (!process.env.HUME_API_KEY) {
      console.warn('⚠️ HUME_API_KEY not configured')
      return NextResponse.json({ emotions: [] })
    }

    // Convert audio to base64
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Audio = buffer.toString('base64')

    // Use Hume Streaming API with WebSocket
    return new Promise<Response>((resolve) => {
      const ws = new WebSocket(`wss://api.hume.ai/v0/stream/models?apikey=${process.env.HUME_API_KEY}`)
      
      let emotionData: any[] = []
      const timeout = setTimeout(() => {
        console.warn('⚠️ WebSocket timeout')
        ws.close()
        resolve(NextResponse.json({ emotions: [] }))
      }, 10000) // 10 second timeout

      ws.on('open', () => {
        console.log('WebSocket connection opened')
        
        // Send audio data with prosody model
        ws.send(JSON.stringify({
          models: {
            prosody: {}
          },
          data: base64Audio,
        }))
      })

      ws.on('message', (data: WebSocket.Data) => {
        try {
          const result = JSON.parse(data.toString())
          console.log('Received Hume response:', JSON.stringify(result, null, 2))

          // Extract emotions from prosody predictions
          const prosody = result.prosody?.predictions?.[0]
          
          if (prosody && prosody.emotions) {
            emotionData = prosody.emotions
              .sort((a: any, b: any) => b.score - a.score)
              .slice(0, 3)
              .map((e: any) => ({
                name: e.name,
                score: Math.round(e.score * 100) / 100,
              }))
            
            console.log('✅ Top emotions detected:', emotionData)
          }
        } catch (err) {
          console.error('Error parsing Hume response:', err)
        }
      })

      ws.on('close', () => {
        clearTimeout(timeout)
        console.log('WebSocket connection closed')
        resolve(NextResponse.json({ emotions: emotionData }))
      })

      ws.on('error', (error) => {
        clearTimeout(timeout)
        console.error('WebSocket error:', error)
        ws.close()
        resolve(NextResponse.json({ emotions: [] }))
      })
    })
  } catch (error) {
    console.error('Error detecting emotions:', error)
    return NextResponse.json({ emotions: [] })
  }
}
