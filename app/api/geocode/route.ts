import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json(
      { error: 'Address parameter is required' },
      { status: 400 }
    )
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      )
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    )

    const data = await response.json()

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0]
      return NextResponse.json({
        address: result.formatted_address,
        location: result.geometry.location,
        placeId: result.place_id,
      })
    } else {
      return NextResponse.json(
        { error: 'Geocoding failed', details: data.status },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


