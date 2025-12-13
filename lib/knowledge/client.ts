import { Pinecone } from '@pinecone-database/pinecone'

if (!process.env.PINECONE_API_KEY) {
  throw new Error('PINECONE_API_KEY is not defined')
}

if (!process.env.PINECONE_INDEX_NAME) {
  throw new Error('PINECONE_INDEX_NAME is not defined')
}

// Initialize Pinecone client for knowledge base
export const knowledgeIndex = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
}).index(process.env.PINECONE_INDEX_NAME)

// Knowledge namespace for separation from user memories
export const KNOWLEDGE_NAMESPACE = 'knowledge'
