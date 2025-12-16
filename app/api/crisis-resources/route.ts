import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const countryCode = searchParams.get('country')

    if (!countryCode) {
      return NextResponse.json(
        { error: 'Country code is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch crisis resources for the specified country
    const { data, error } = await supabase
      .from('crisis_resources')
      .select('*')
      .eq('country_code', countryCode.toUpperCase())
      .single()

    if (error || !data) {
      // If not found, return 'OTHER' as fallback
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('crisis_resources')
        .select('*')
        .eq('country_code', 'OTHER')
        .single()

      if (fallbackError || !fallbackData) {
        return NextResponse.json(
          { error: 'Crisis resources not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(fallbackData)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching crisis resources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch crisis resources' },
      { status: 500 }
    )
  }
}

// List all available countries
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('crisis_resources')
      .select('country_code, country_name')
      .order('country_name')

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch countries' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching countries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    )
  }
}
