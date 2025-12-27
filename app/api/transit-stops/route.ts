import { NextRequest, NextResponse } from 'next/server'
import { resolveApiKey } from '@/utils/apiKeyResolver'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const type = searchParams.get('type') // 'bus' or 'train'

  if (!lat || !lng || !type) {
    return NextResponse.json(
      { error: 'Latitude, longitude, and type (bus/train) parameters are required' },
      { status: 400 }
    )
  }

  if (type !== 'bus' && type !== 'train') {
    return NextResponse.json(
      { error: 'Type must be either "bus" or "train"' },
      { status: 400 }
    )
  }

  try {
    const userApiKey = searchParams.get('apiKey') // Optional user API key from client
    const apiKey = resolveApiKey(request, userApiKey)
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      )
    }

    // Use Places API Text Search for more accurate results
    // For train: search for "train station", "subway station", "metro station", "railway station"
    // For bus: search for "bus stop", "bus station"
    let query = ''
    let placeType = ''
    
    if (type === 'train') {
      query = 'train station OR subway station OR metro station OR railway station'
      placeType = 'train_station'
    } else {
      query = 'bus stop OR bus station'
      placeType = 'bus_station'
    }
    
    // First, try text search for more specific results
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=5000&key=${apiKey}`
    
    const textSearchResponse = await fetch(textSearchUrl)
    const textSearchData = await textSearchResponse.json()
    
    let places: any[] = []
    
    if (textSearchData.status === 'OK' && textSearchData.results) {
      // Filter results based on place types to ensure accuracy
      places = textSearchData.results.filter((place: any) => {
        const types = place.types || []
        if (type === 'train') {
          // For train: accept train_station, subway_station, or places with "train", "subway", "metro", "rail" in name
          const name = (place.name || '').toLowerCase()
          return types.includes('train_station') || 
                 types.includes('subway_station') ||
                 name.includes('train') ||
                 name.includes('subway') ||
                 name.includes('metro') ||
                 name.includes('rail')
        } else {
          // For bus: accept bus_station or places with "bus" in name
          const name = (place.name || '').toLowerCase()
          return types.includes('bus_station') || name.includes('bus')
        }
      })
    }
    
    // If we don't have enough results, try nearby search with specific type
    if (places.length < 3) {
      const nearbySearchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${placeType}&key=${apiKey}`
      
      const nearbyResponse = await fetch(nearbySearchUrl)
      const nearbyData = await nearbyResponse.json()

      if (nearbyData.status === 'OK' && nearbyData.results) {
        // Merge results, avoiding duplicates and filtering by type
        const existingPlaceIds = new Set(places.map((p: any) => p.place_id))
        const additionalPlaces = nearbyData.results.filter((p: any) => {
          if (existingPlaceIds.has(p.place_id)) return false
          
          // Additional filtering for train vs bus
          if (type === 'train') {
            const types = p.types || []
            const name = (p.name || '').toLowerCase()
            return types.includes('train_station') || 
                   types.includes('subway_station') ||
                   name.includes('train') ||
                   name.includes('subway') ||
                   name.includes('metro') ||
                   name.includes('rail')
          } else {
            const types = p.types || []
            const name = (p.name || '').toLowerCase()
            return types.includes('bus_station') || name.includes('bus')
          }
        })
        places.push(...additionalPlaces)
      }
    }

    // Calculate distances from origin to each stop using Distance Matrix API
    if (places.length === 0) {
      return NextResponse.json({ stops: [] })
    }

    const destinations = places.map((place: any) => 
      `${place.geometry.location.lat},${place.geometry.location.lng}`
    ).join('|')

    const distanceMatrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=${destinations}&mode=walking&key=${apiKey}&units=imperial`
    
    const distanceResponse = await fetch(distanceMatrixUrl)
    const distanceData = await distanceResponse.json()

    if (distanceData.status !== 'OK') {
      return NextResponse.json(
        { error: 'Failed to calculate distances', details: distanceData.status },
        { status: 400 }
      )
    }

    // Combine place data with distance data
    const stopsWithDistance = places.map((place: any, index: number) => {
      const element = distanceData.rows[0]?.elements[index]
      return {
        name: place.name,
        address: place.vicinity || place.formatted_address || 'Address not available',
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        },
        distance: element?.distance?.text || 'Unknown',
        distanceValue: element?.distance?.value || 0,
        placeId: place.place_id,
      }
    }).filter((stop: any) => stop.distanceValue > 0) // Filter out invalid distances

    // Sort by distance and take top 3
    const sortedStops = stopsWithDistance
      .sort((a: any, b: any) => a.distanceValue - b.distanceValue)
      .slice(0, 3)

    return NextResponse.json({ stops: sortedStops })
  } catch (error) {
    console.error('Transit stops search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

