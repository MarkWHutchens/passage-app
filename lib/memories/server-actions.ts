'use server'

import { createClient } from '@/lib/supabase/server'

export interface TaggedMessage {
  tagId: string
  messageId: string
  content: string
  taggedAt: string
  conversationId: string
  conversationTitle: string | null
  tagType: string
  customLabel: string | null
}

export interface GroupedTaggedMessages {
  remember: TaggedMessage[]
  therapist: TaggedMessage[]
  pattern: TaggedMessage[]
  custom: Record<string, TaggedMessage[]>
}

// 1. Fetch all tagged messages for user, grouped by tag type
export async function getTaggedMessages(userId: string): Promise<GroupedTaggedMessages> {
  const supabase = await createClient()
  
  // Fetch all memory tags with related message and conversation data
  const { data: tags, error } = await supabase
    .from('memory_tags')
    .select(`
      id,
      tag_type,
      custom_label,
      created_at,
      message_id,
      messages:message_id (
        id,
        content,
        conversation_id,
        conversations:conversation_id (
          id,
          title
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tagged messages:', error)
    return { remember: [], therapist: [], pattern: [], custom: {} }
  }

  // Transform and group the data
  const grouped: GroupedTaggedMessages = {
    remember: [],
    therapist: [],
    pattern: [],
    custom: {}
  }

  tags?.forEach((tag: any) => {
    if (!tag.messages) return

    const message: TaggedMessage = {
      tagId: tag.id,
      messageId: tag.messages.id,
      content: tag.messages.content,
      taggedAt: tag.created_at,
      conversationId: tag.messages.conversation_id,
      conversationTitle: tag.messages.conversations?.title || null,
      tagType: tag.tag_type,
      customLabel: tag.custom_label
    }

    // Group by tag type
    if (tag.tag_type === 'remind') {
      grouped.remember.push(message)
    } else if (tag.tag_type === 'therapist') {
      grouped.therapist.push(message)
    } else if (tag.tag_type === 'pattern') {
      grouped.pattern.push(message)
    } else if (tag.tag_type === 'custom' && tag.custom_label) {
      if (!grouped.custom[tag.custom_label]) {
        grouped.custom[tag.custom_label] = []
      }
      grouped.custom[tag.custom_label].push(message)
    }
  })

  return grouped
}

// 2. Update tag type or custom label
export async function updateMemoryTag(
  tagId: string, 
  newTagType: string, 
  newCustomLabel?: string
): Promise<void> {
  const supabase = await createClient()
  
  const updateData: any = {
    tag_type: newTagType
  }
  
  if (newTagType === 'custom' && newCustomLabel) {
    updateData.custom_label = newCustomLabel
  } else {
    updateData.custom_label = null
  }

  const { error } = await (supabase as any)
    .from('memory_tags')
    .update(updateData)
    .eq('id', tagId)

  if (error) {
    console.error('Error updating memory tag:', error)
    throw new Error('Failed to update tag')
  }
}

// 3. Remove a tag (delete from memory_tags)
export async function removeMemoryTag(tagId: string): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('memory_tags')
    .delete()
    .eq('id', tagId)

  if (error) {
    console.error('Error removing memory tag:', error)
    throw new Error('Failed to remove tag')
  }
}

// 4. Get list of unique custom tag labels for this user
export async function getCustomTags(userId: string): Promise<string[]> {
  const supabase = await createClient()
  
  const { data: tags, error } = await supabase
    .from('memory_tags')
    .select('custom_label')
    .eq('user_id', userId)
    .eq('tag_type', 'custom')
    .not('custom_label', 'is', null)

  if (error) {
    console.error('Error fetching custom tags:', error)
    return []
  }

  // Get unique labels
  const labels = tags.map((t: any) => t.custom_label).filter(Boolean)
  const uniqueLabels = Array.from(new Set(labels))
  return uniqueLabels as string[]
}
