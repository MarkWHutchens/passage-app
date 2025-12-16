import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET all crisis resources (for admin view)
export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('crisis_resources')
      .select('*')
      .order('country_name')

    if (error) {
      console.error('Error fetching crisis resources:', error)
      return NextResponse.json(
        { error: 'Failed to fetch crisis resources' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET crisis resources:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// UPDATE crisis resource
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, country_code, country_name, content } = body

    if (!id || !country_code || !country_name || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('crisis_resources')
      .update({
        country_code: country_code.toUpperCase(),
        country_name,
        content,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating crisis resource:', error)
      return NextResponse.json(
        { error: 'Failed to update crisis resource' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT crisis resource:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// CREATE new crisis resource
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { country_code, country_name, content } = body

    if (!country_code || !country_name || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('crisis_resources')
      .insert({
        country_code: country_code.toUpperCase(),
        country_name,
        content,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating crisis resource:', error)
      return NextResponse.json(
        { error: 'Failed to create crisis resource' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in POST crisis resource:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE crisis resource
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('crisis_resources')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting crisis resource:', error)
      return NextResponse.json(
        { error: 'Failed to delete crisis resource' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE crisis resource:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
