import { knowledgeIndex, KNOWLEDGE_NAMESPACE } from './client'
import { generateEmbedding } from '../pinecone/embeddings'
import { EntryPoint } from '@/types'

export interface KnowledgeEntry {
  id: string
  type: 'education' | 'story' | 'exercise'
  entry_point: EntryPoint | 'general'
  title: string
  content: string
  tags: string[]
  file_url?: string
  file_name?: string
  file_type?: string
}

/**
 * Search knowledge base for relevant content
 */
export async function searchKnowledge(
  query: string,
  entryPoint?: EntryPoint,
  topK: number = 3
): Promise<KnowledgeEntry[]> {
  try {
    // Get embedding for the query
    const queryEmbedding = await generateEmbedding(query)

    // Build filter for entry point if provided
    const filter: any = {}
    if (entryPoint) {
      filter.$or = [
        { entry_point: { $eq: entryPoint } },
        { entry_point: { $eq: 'general' } }
      ]
    }

    // Query Pinecone
    const results = await knowledgeIndex.namespace(KNOWLEDGE_NAMESPACE).query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    })

    // Map results to KnowledgeEntry format
    return results.matches.map(match => ({
      id: match.id,
      type: match.metadata?.type as 'education' | 'story' | 'exercise',
      entry_point: match.metadata?.entry_point as EntryPoint | 'general',
      title: match.metadata?.title as string,
      content: match.metadata?.content as string,
      tags: match.metadata?.tags as string[] || [],
      file_url: match.metadata?.file_url as string | undefined,
      file_name: match.metadata?.file_name as string | undefined,
      file_type: match.metadata?.file_type as string | undefined,
    }))
  } catch (error) {
    console.error('Error searching knowledge:', error)
    return [] // Graceful failure - return empty array
  }
}

/**
 * Get specific knowledge entry by ID
 */
export async function getKnowledgeById(id: string): Promise<KnowledgeEntry | null> {
  try {
    const result = await knowledgeIndex.namespace(KNOWLEDGE_NAMESPACE).fetch([id])
    
    if (!result.records[id]) {
      return null
    }

    const record = result.records[id]
    return {
      id: record.id,
      type: record.metadata?.type as 'education' | 'story' | 'exercise',
      entry_point: record.metadata?.entry_point as EntryPoint | 'general',
      title: record.metadata?.title as string,
      content: record.metadata?.content as string,
      tags: record.metadata?.tags as string[] || [],
      file_url: record.metadata?.file_url as string | undefined,
      file_name: record.metadata?.file_name as string | undefined,
      file_type: record.metadata?.file_type as string | undefined,
    }
  } catch (error) {
    console.error('Error fetching knowledge:', error)
    return null
  }
}
