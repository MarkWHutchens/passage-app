import { ModelContext, ModelType } from '@/types'

export function selectModel(context: ModelContext): ModelType {
  // Use Sonnet for:
  // - Pattern synthesis
  // - Recall queries
  // - Deep conversations (10+ messages)
  // - Long/complex user messages
  
  if (context.hasPatternQuery) return 'sonnet'
  if (context.isRecallQuery) return 'sonnet'
  if (context.conversationDepth > 10) return 'sonnet'
  if (context.messageLength > 500) return 'sonnet'
  
  // Everything else: Haiku (faster, cheaper)
  return 'haiku'
}

export function getModelName(modelType: ModelType): string {
  return modelType === 'sonnet' 
    ? process.env.CLAUDE_SONNET_MODEL || 'claude-3-5-sonnet-latest'
    : process.env.CLAUDE_HAIKU_MODEL || 'claude-3-5-haiku-latest'
}
