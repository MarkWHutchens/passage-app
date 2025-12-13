import { getIndex } from './client'
import { generateEmbedding } from './embeddings'
import { PineconeMetadata } from '@/types'

export async function storeMessage(
  messageId: string,
  userId: string,
  conversationId: string,
  content: string,
  role: 'user' | 'assistant',
  entryPoint: string,
  tags?: string[]
) {
  const index = getIndex()
  const embedding = await generateEmbedding(content)

  const metadata: PineconeMetadata = {
    user_id: userId,
    conversation_id: conversationId,
    message_id: messageId,
    role,
    timestamp: new Date().toISOString(),
    entry_point: entryPoint,
    tags: tags || [],
  }

  await index.upsert([
    {
      id: messageId,
      values: embedding,
      metadata: metadata as any,
    },
  ])
}

export async function retrieveContext(
  userId: string,
  query: string,
  supabase: any,
  topK: number = 5
): Promise<Array<{ content: string; role: string; timestamp: string; score: number }>> {
  const index = getIndex()
  const queryEmbedding = await generateEmbedding(query)

  const results = await index.query({
    vector: queryEmbedding,
    topK,
    filter: {
      user_id: { $eq: userId },
    },
    includeMetadata: true,
  })

  // Extract message IDs from results
  const messageIds = results.matches.map(match => 
    (match.metadata as any).message_id
  ).filter(Boolean)

  if (messageIds.length === 0) {
    return []
  }

  // Fetch actual message content from Supabase
  const { data: messages } = await supabase
    .from('messages')
    .select('id, content, role, created_at')
    .in('id', messageIds)

  if (!messages) {
    return []
  }

  // Create a map of message content by ID
  const messageMap = new Map(messages.map((msg: any) => [msg.id, msg]))

  // Match Pinecone results with message content, maintaining score order
  return results.matches
    .map(match => {
      const messageId = (match.metadata as any).message_id
      const message: any = messageMap.get(messageId)
      if (!message) return null
      
      return {
        content: message.content,
        role: message.role,
        timestamp: message.created_at,
        score: match.score || 0,
      }
    })
    .filter(Boolean) as Array<{ content: string; role: string; timestamp: string; score: number }>
}

export async function deleteUserVectors(userId: string) {
  const index = getIndex()
  
  await index.deleteMany({
    filter: {
      user_id: { $eq: userId },
    },
  })
}
