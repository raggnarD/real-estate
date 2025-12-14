import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const origin = searchParams.get('origin')
  const destination = searchParams.get('destination')
  const mode = searchParams.get('mode') || 'driving' // driving, transit, walking, bicycling

  if (!origin || !destination) {
    return NextResponse.json(
      { error: 'Origin and destination parameters are required' },
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

    // Use Distance Matrix API with mode parameter
    const modeParam = mode === 'transit' ? 'transit' : mode === 'walking' ? 'walking' : mode === 'bicycling' ? 'bicycling' : 'driving'
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=${modeParam}&key=${apiKey}&units=imperial`
    )

    const data = await response.json()

    if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
      const element = data.rows[0].elements[0]
      return NextResponse.json({
        distance: element.distance.text,
        duration: element.duration.text,
        distanceValue: element.distance.value,
        durationValue: element.duration.value,
        mode: modeParam,
      })
    } else {
      return NextResponse.json(
        { error: 'Commute calculation failed', details: data.status },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Commute calculation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

