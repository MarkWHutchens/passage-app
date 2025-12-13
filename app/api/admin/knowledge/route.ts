import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addKnowledge, deleteKnowledge, listAllKnowledge } from '@/lib/knowledge/ingest'

// Check if user is admin
async function isAdmin(email: string): Promise<boolean> {
  return email === process.env.ADMIN_EMAIL
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !(await isAdmin(user.email || ''))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, type, entry_points, tags } = body

    if (!title || !content || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Add knowledge entry for each selected entry point
    const ids = []
    for (const entryPoint of entry_points) {
      const id = await addKnowledge({
        type,
        entry_point: entryPoint,
        title,
        content,
        tags: tags || [],
      })
      ids.push(id)
    }

    return NextResponse.json({ success: true, ids })
  } catch (error) {
    console.error('Error adding knowledge:', error)
    return NextResponse.json({ error: 'Failed to add knowledge' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !(await isAdmin(user.email || ''))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const entries = await listAllKnowledge()
    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Error listing knowledge:', error)
    return NextResponse.json({ error: 'Failed to list knowledge' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !(await isAdmin(user.email || ''))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
    }

    await deleteKnowledge(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting knowledge:', error)
    return NextResponse.json({ error: 'Failed to delete knowledge' }, { status: 500 })
  }
}
