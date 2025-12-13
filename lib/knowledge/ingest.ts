import { knowledgeIndex, KNOWLEDGE_NAMESPACE } from './client'
import { generateEmbedding } from '../pinecone/embeddings'
import { KnowledgeEntry } from './queries'
import { EntryPoint } from '@/types'

/**
 * Add a new knowledge entry to the database
 */
export async function addKnowledge(entry: Omit<KnowledgeEntry, 'id'>): Promise<string> {
  try {
    // Generate embedding for the content
    const embedding = await generateEmbedding(entry.content)
    
    // Generate unique ID
    const id = `knowledge-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    // Build metadata object
    const metadata: any = {
      type: entry.type,
      entry_point: entry.entry_point,
      title: entry.title,
      content: entry.content,
      tags: entry.tags,
    }
    
    // Add file metadata if present
    if (entry.file_url) metadata.file_url = entry.file_url
    if (entry.file_name) metadata.file_name = entry.file_name
    if (entry.file_type) metadata.file_type = entry.file_type
    
    // Store in Pinecone
    await knowledgeIndex.namespace(KNOWLEDGE_NAMESPACE).upsert([{
      id,
      values: embedding,
      metadata,
    }])
    
    console.log('✅ Knowledge added:', id)
    return id
  } catch (error) {
    console.error('Error adding knowledge:', error)
    throw error
  }
}

/**
 * Update an existing knowledge entry
 */
export async function updateKnowledge(id: string, entry: Partial<Omit<KnowledgeEntry, 'id'>>): Promise<void> {
  try {
    // Fetch existing entry
    const existing = await knowledgeIndex.namespace(KNOWLEDGE_NAMESPACE).fetch([id])
    
    if (!existing.records[id]) {
      throw new Error('Knowledge entry not found')
    }
    
    const existingMetadata = existing.records[id].metadata
    
    // Merge with new data
    const updatedMetadata = {
      ...existingMetadata,
      ...entry,
    }
    
    // Generate new embedding if content changed
    let embedding = existing.records[id].values
    if (entry.content) {
      embedding = await generateEmbedding(entry.content)
    }
    
    // Update in Pinecone
    await knowledgeIndex.namespace(KNOWLEDGE_NAMESPACE).upsert([{
      id,
      values: embedding,
      metadata: updatedMetadata,
    }])
    
    console.log('✅ Knowledge updated:', id)
  } catch (error) {
    console.error('Error updating knowledge:', error)
    throw error
  }
}

/**
 * Delete a knowledge entry
 */
export async function deleteKnowledge(id: string): Promise<void> {
  try {
    await knowledgeIndex.namespace(KNOWLEDGE_NAMESPACE).deleteOne(id)
    console.log('✅ Knowledge deleted:', id)
  } catch (error) {
    console.error('Error deleting knowledge:', error)
    throw error
  }
}

/**
 * List all knowledge entries (for admin interface)
 */
export async function listAllKnowledge(): Promise<KnowledgeEntry[]> {
  try {
    // Query with a dummy vector to get all entries
    // This is a workaround since Pinecone doesn't have a "list all" operation
    const dummyEmbedding = new Array(1024).fill(0)
    
    const results = await knowledgeIndex.namespace(KNOWLEDGE_NAMESPACE).query({
      vector: dummyEmbedding,
      topK: 100, // Limit to 100 entries
      includeMetadata: true,
    })
    
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
    console.error('Error listing knowledge:', error)
    return []
  }
}
