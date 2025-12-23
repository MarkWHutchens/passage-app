'use server'

import { createClient } from '@/lib/supabase/server'

export async function exportAllUserData(userId: string) {
  const supabase = await createClient()

  try {
    // Fetch user profile
    const { data: profile } = await supabase
      .from('users')
      .select('email, name, country, entry_point, voice_preference, created_at')
      .eq('id', userId)
      .single()

    // Fetch conversations with messages
    const { data: conversations } = await supabase
      .from('conversations')
      .select(`
        id,
        title,
        created_at,
        updated_at,
        messages (
          id,
          content,
          role,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Fetch patterns
    const { data: patterns } = await supabase
      .from('patterns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Fetch insights
    const { data: insights } = await supabase
      .from('insights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Fetch tagged memories with message content
    const { data: taggedMemories } = await supabase
      .from('memory_tags')
      .select(`
        id,
        tag_type,
        custom_label,
        created_at,
        messages:message_id (
          id,
          content,
          created_at,
          conversation_id
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Format the export data
    const exportData = {
      exportDate: new Date().toISOString(),
      user: profile || {},
      conversations: conversations || [],
      patterns: patterns || [],
      insights: insights || [],
      taggedMemories: taggedMemories || []
    }

    return { success: true, data: exportData }
  } catch (error) {
    console.error('Error exporting user data:', error)
    return { success: false, error: 'Failed to export data' }
  }
}
