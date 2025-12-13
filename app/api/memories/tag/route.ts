import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId, tagType, customLabel } = await request.json()

    if (!messageId || !tagType) {
      return NextResponse.json(
        { error: 'Missing messageId or tagType' },
        { status: 400 }
      )
    }

    // Insert the tag
    const { data, error } = await supabase
      .from('memory_tags')
      .insert({
        user_id: user.id,
        message_id: messageId,
        tag_type: tagType,
        custom_label: customLabel || null,
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating tag:', error)
      return NextResponse.json(
        { error: 'Failed to create tag' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, tag: data })
  } catch (error) {
    console.error('Error in tag route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get('id')

    if (!tagId) {
      return NextResponse.json({ error: 'Missing tag id' }, { status: 400 })
    }

    const { error } = await supabase
      .from('memory_tags')
      .delete()
      .eq('id', tagId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting tag:', error)
      return NextResponse.json(
        { error: 'Failed to delete tag' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in delete tag route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
