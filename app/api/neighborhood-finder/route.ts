import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const workLat = searchParams.get('lat')
  const workLng = searchParams.get('lng')
  const mode = searchParams.get('mode') || 'driving'
  const maxTime = searchParams.get('maxTime') // in minutes

  if (!workLat || !workLng || !maxTime) {
    return NextResponse.json(
      { error: 'Work location (lat, lng) and maxTime parameters are required' },
      { status: 400 }
    )
  }

  const maxTimeMinutes = parseInt(maxTime, 10)
  if (isNaN(maxTimeMinutes) || maxTimeMinutes < 1) {
    return NextResponse.json(
      { error: 'maxTime must be a positive number' },
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

    const lat = parseFloat(workLat)
    const lng = parseFloat(workLng)

    // Step 1: Find cities within a reasonable radius using Places API
    // We'll search for cities within approximately 100 miles (160km radius)
    // Using Text Search to find cities
    const radius = 160000 // 100 miles in meters
    const searchRadius = Math.min(radius, 50000) // Places API has limits, start with 50km

    // Use Places API Nearby Search to find cities (localities)
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${searchRadius}&type=locality&key=${apiKey}`
    
    const placesResponse = await fetch(placesUrl)
    const placesData = await placesResponse.json()

    if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
      return NextResponse.json(
        { error: 'Failed to search for cities', details: placesData.status },
        { status: 400 }
      )
    }

    const cities = placesData.results || []
    
    // If we don't have enough results, try Text Search as fallback
    if (cities.length < 10) {
      const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=cities+near+${lat},${lng}&type=locality&key=${apiKey}`
      const textResponse = await fetch(textSearchUrl)
      const textData = await textResponse.json()
      
      if (textData.status === 'OK' && textData.results) {
        // Merge results, avoiding duplicates
        const existingPlaceIds = new Set(cities.map((c: any) => c.place_id))
        const additionalCities = textData.results.filter((c: any) => !existingPlaceIds.has(c.place_id))
        cities.push(...additionalCities)
      }
    }

    if (cities.length === 0) {
      return NextResponse.json({ cities: [] })
    }

    // Step 2: Calculate commute times for all cities using Distance Matrix API
    // Distance Matrix API allows up to 25 destinations per request
    const batchSize = 25
    const allCityResults: any[] = []

    for (let i = 0; i < cities.length; i += batchSize) {
      const batch = cities.slice(i, i + batchSize)
      const destinations = batch.map((city: any) => 
        `${city.geometry.location.lat},${city.geometry.location.lng}`
      ).join('|')

      // Determine travel mode for Distance Matrix
      let travelMode = 'driving'
      if (mode === 'walking') {
        travelMode = 'walking'
      } else if (mode === 'bicycling') {
        travelMode = 'bicycling'
      } else if (mode === 'transit' || mode === 'bus' || mode === 'train') {
        travelMode = 'transit'
      }

      const distanceMatrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=${destinations}&mode=${travelMode}&units=imperial&key=${apiKey}`
      
      // For transit, add transit mode filter
      if (travelMode === 'transit') {
        const transitMode = mode === 'bus' ? 'bus' : mode === 'train' ? 'rail' : 'bus|rail'
        const transitUrl = `${distanceMatrixUrl}&transit_mode=${transitMode}`
        const matrixResponse = await fetch(transitUrl)
        const matrixData = await matrixResponse.json()

        if (matrixData.status === 'OK' && matrixData.rows && matrixData.rows[0]) {
          matrixData.rows[0].elements.forEach((element: any, index: number) => {
            if (element.status === 'OK' && element.duration) {
              const durationMinutes = Math.round(element.duration.value / 60)
              if (durationMinutes <= maxTimeMinutes) {
                const city = batch[index]
                allCityResults.push({
                  name: city.name,
                  address: city.vicinity || city.formatted_address || city.name,
                  location: {
                    lat: city.geometry.location.lat,
                    lng: city.geometry.location.lng,
                  },
                  commuteTime: durationMinutes,
                  commuteTimeText: element.duration.text,
                  distance: element.distance?.text || 'Unknown',
                  distanceValue: element.distance?.value || 0,
                  placeId: city.place_id,
                })
              }
            }
          })
        }
      } else {
        const matrixResponse = await fetch(distanceMatrixUrl)
        const matrixData = await matrixResponse.json()

        if (matrixData.status === 'OK' && matrixData.rows && matrixData.rows[0]) {
          matrixData.rows[0].elements.forEach((element: any, index: number) => {
            if (element.status === 'OK' && element.duration) {
              const durationMinutes = Math.round(element.duration.value / 60)
              if (durationMinutes <= maxTimeMinutes) {
                const city = batch[index]
                allCityResults.push({
                  name: city.name,
                  address: city.vicinity || city.formatted_address || city.name,
                  location: {
                    lat: city.geometry.location.lat,
                    lng: city.geometry.location.lng,
                  },
                  commuteTime: durationMinutes,
                  commuteTimeText: element.duration.text,
                  distance: element.distance?.text || 'Unknown',
                  distanceValue: element.distance?.value || 0,
                  placeId: city.place_id,
                })
              }
            }
          })
        }
      }
    }

    // Sort by commute time (shortest first)
    allCityResults.sort((a, b) => a.commuteTime - b.commuteTime)

    return NextResponse.json({
      cities: allCityResults,
      workLocation: { lat, lng },
      mode,
      maxTime: maxTimeMinutes,
    })
  } catch (error) {
    console.error('Neighborhood finder error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

