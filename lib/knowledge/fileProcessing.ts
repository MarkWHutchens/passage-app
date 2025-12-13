import * as pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET_NAME = 'knowledge-files'

/**
 * Extract text from PDF file
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const data = await (pdfParse as any)(buffer)
    return data.text
  } catch (error) {
    console.error('Error extracting PDF text:', error)
    throw new Error('Failed to extract text from PDF')
  }
}

/**
 * Extract text from DOCX file
 */
export async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  } catch (error) {
    console.error('Error extracting DOCX text:', error)
    throw new Error('Failed to extract text from DOCX')
  }
}

/**
 * Extract text from TXT file
 */
export function extractTxtText(buffer: Buffer): string {
  return buffer.toString('utf-8')
}

/**
 * Upload file to Supabase storage
 */
export async function uploadFileToStorage(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  try {
    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME)
    
    if (!bucketExists) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
      })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFilename = `${timestamp}-${sanitizedFilename}`

    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(uniqueFilename, file, {
        contentType,
        cacheControl: '3600',
      })

    if (error) {
      console.error('Error uploading file:', error)
      throw new Error('Failed to upload file')
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path)

    return publicUrl
  } catch (error) {
    console.error('Error in uploadFileToStorage:', error)
    throw error
  }
}

/**
 * Process uploaded file based on type
 */
export async function processFile(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<{ text?: string; url: string; fileType: string }> {
  try {
    console.log('processFile: Starting with', { filename, contentType, bufferSize: buffer.length })
    
    // Upload file to storage first
    console.log('processFile: Uploading to storage...')
    const url = await uploadFileToStorage(buffer, filename, contentType)
    console.log('processFile: File uploaded successfully:', url)

    let text: string | undefined
    let fileType = 'document'

    // Extract text based on file type
    if (contentType === 'application/pdf') {
      console.log('processFile: Extracting PDF text...')
      text = await extractPdfText(buffer)
      fileType = 'pdf'
      console.log('processFile: PDF text extracted, length:', text.length)
    } else if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('processFile: Extracting DOCX text...')
      text = await extractDocxText(buffer)
      fileType = 'docx'
      console.log('processFile: DOCX text extracted, length:', text.length)
    } else if (contentType === 'text/plain') {
      console.log('processFile: Extracting TXT text...')
      text = extractTxtText(buffer)
      fileType = 'txt'
      console.log('processFile: TXT text extracted, length:', text.length)
    } else if (contentType.startsWith('video/')) {
      fileType = 'video'
      console.log('processFile: Video file, no text extraction')
      // No text extraction for video
    } else if (contentType.startsWith('audio/')) {
      fileType = 'audio'
      console.log('processFile: Audio file, no text extraction')
      // No text extraction for audio
    }

    console.log('processFile: Complete', { fileType, textLength: text?.length })
    return { text, url, fileType }
  } catch (error: any) {
    console.error('processFile: Error occurred')
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('Full error:', error)
    throw error
  }
}

/**
 * Transcribe audio/video using Whisper
 */
export async function transcribeMedia(audioUrl: string): Promise<string> {
  try {
    // Call the Whisper API via OpenAI client
    const OpenAI = require('openai').default
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    
    // Download the file first
    const response = await fetch(audioUrl)
    const buffer = await response.arrayBuffer()
    const file = new File([buffer], 'audio.mp3', { type: 'audio/mp3' })
    
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
    })
    
    return transcription.text
  } catch (error) {
    console.error('Error transcribing media:', error)
    throw new Error('Failed to transcribe media')
  }
}
