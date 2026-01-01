import { NextRequest, NextResponse } from 'next/server'
import { resolveApiKey } from '@/utils/apiKeyResolver'
import { getCitiesNearLocation, formatCityForGeocoding } from '@/utils/cityDataLoader'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const workLat = searchParams.get('lat')
  const workLng = searchParams.get('lng')
  const mode = searchParams.get('mode') || 'driving'
  const maxTime = searchParams.get('maxTime') // in minutes
  const userApiKey = searchParams.get('apiKey') // Optional user API key from client

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
    const apiKey = resolveApiKey(request, userApiKey)
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      )
    }

    const lat = parseFloat(workLat)
    const lng = parseFloat(workLng)

    // Step 1: Get state from work location
    let workState = ''
    let workStateFull = ''
    try {
      const reverseGeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      const reverseResponse = await fetch(reverseGeocodeUrl)
      const reverseData = await reverseResponse.json()
      
      if (reverseData.status === 'OK' && reverseData.results.length > 0) {
        for (const result of reverseData.results) {
          const state = result.address_components?.find((comp: any) => 
            comp.types.includes('administrative_area_level_1')
          )
          if (state) {
            workState = state.short_name || state.long_name
            workStateFull = state.long_name
            break
          }
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
    }

    // Step 2: Use a comprehensive list of cities/towns to search for
    // We'll use Geocoding API to find city centers by searching for city names
    // This approach is more reliable than Places API for finding all cities
    
    const cities: any[] = []
    const cityNames = new Set<string>()
    
    // Strategy 1: Use Places API Text Search with broader queries
    const searchQueries = [
      `cities near ${lat},${lng}`,
      `towns near ${lat},${lng}`,
      `municipalities near ${lat},${lng}`,
    ]
    
    if (workState) {
      searchQueries.push(
        `cities in ${workState}`,
        `towns in ${workState}`
      )
    }

    for (const query of searchQueries) {
      try {
        const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=locality&key=${apiKey}`
        const textResponse = await fetch(textSearchUrl)
        const textData = await textResponse.json()
        
        if (textData.status === 'OK' && textData.results) {
          for (const place of textData.results) {
            const cityName = place.name?.toLowerCase().trim()
            if (cityName && !cityNames.has(cityName)) {
              cityNames.add(cityName)
              cities.push({
                place_id: place.place_id,
                name: place.name,
                formatted_address: place.formatted_address || place.vicinity || place.name,
                geometry: place.geometry,
              })
            }
          }
        }
      } catch (error) {
        console.error(`Error searching with query "${query}":`, error)
      }
    }

    // Strategy 2: Nearby Search with multiple radii and pagination
    const searchRadiuses = [50000, 100000, 160000] // 50km, 100km, 160km
    for (const radius of searchRadiuses) {
      try {
        let nextPageToken: string | null = null
        let pageCount = 0
        const maxPages = 5 // Increased pages
        
        do {
          let nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=locality&key=${apiKey}`
          if (nextPageToken) {
            nearbyUrl += `&pagetoken=${nextPageToken}`
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
          
          const nearbyResponse = await fetch(nearbyUrl)
          const nearbyData = await nearbyResponse.json()
          
          if (nearbyData.status === 'OK' && nearbyData.results) {
            for (const place of nearbyData.results) {
              const cityName = place.name?.toLowerCase().trim()
              if (cityName && !cityNames.has(cityName)) {
                cityNames.add(cityName)
                cities.push({
                  place_id: place.place_id,
                  name: place.name,
                  formatted_address: place.formatted_address || place.vicinity || place.name,
                  geometry: place.geometry,
                })
              }
            }
            nextPageToken = nearbyData.next_page_token || null
            pageCount++
          } else {
            nextPageToken = null
          }
        } while (nextPageToken && pageCount < maxPages)
      } catch (error) {
        console.error(`Error with nearby search radius ${radius}:`, error)
      }
    }

    // Strategy 3: Use comprehensive city data from local JSON file
    // This provides a complete list of all US cities and is more reliable than hardcoded lists
    // City data source: https://simplemaps.com/data/us-cities
    // The fallback city data used by this application was accessed via SimpleMaps.
    // Only use this if we haven't found many cities yet, or if Places API searches failed
    if (workState && (cities.length < 50 || cities.length === 0)) {
      try {
        // Get cities from the comprehensive dataset
        // Use a generous radius (200km) to ensure we get all cities within reasonable commute distance
        // The actual commute time filtering happens later via Distance Matrix API
        const maxCommuteKm = Math.max(160, maxTimeMinutes * 1.5) // Rough estimate: 1.5km per minute
        const cityDataList = await getCitiesNearLocation(lat, lng, maxCommuteKm, workState)
        
        // Limit to top 200 cities by distance to avoid too many API calls
        const citiesToProcess = cityDataList.slice(0, 200)
        
        // Geocode each city to get place_id and formatted address
        // Process in batches to avoid overwhelming the API
        const batchSize = 10
        for (let i = 0; i < citiesToProcess.length; i += batchSize) {
          const batch = citiesToProcess.slice(i, i + batchSize)
          
          await Promise.all(batch.map(async (cityData) => {
            try {
              const cityNameLower = cityData.city.toLowerCase().trim()
              // Skip if we already have this city
              if (cityNames.has(cityNameLower)) return
              
              // Use existing coordinates if available, otherwise geocode
              const cityLat = typeof cityData.lat === 'string' ? parseFloat(cityData.lat) : cityData.lat
              const cityLng = typeof cityData.lng === 'string' ? parseFloat(cityData.lng) : cityData.lng
              
              if (!isNaN(cityLat) && !isNaN(cityLng)) {
                // Try to get place_id via reverse geocoding
                try {
                  const reverseGeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${cityLat},${cityLng}&key=${apiKey}`
                  const reverseResponse = await fetch(reverseGeocodeUrl)
                  const reverseData = await reverseResponse.json()
                  
                  if (reverseData.status === 'OK' && reverseData.results.length > 0) {
                    // Find result with locality type
                    const cityResult = reverseData.results.find((result: any) => 
                      result.types.includes('locality') || 
                      result.types.includes('administrative_area_level_3')
                    ) || reverseData.results[0]
                    
                    cityNames.add(cityNameLower)
                    cities.push({
                      place_id: cityResult.place_id,
                      name: cityData.city,
                      formatted_address: cityResult.formatted_address,
                      geometry: {
                        location: {
                          lat: cityLat,
                          lng: cityLng
                        }
                      }
                    })
                  } else {
                    // Fallback: use coordinates directly
                    cityNames.add(cityNameLower)
                    cities.push({
                      place_id: `city_${cityData.city}_${cityData.state_id}`,
                      name: cityData.city,
                      formatted_address: formatCityForGeocoding(cityData),
                      geometry: {
                        location: {
                          lat: cityLat,
                          lng: cityLng
                        }
                      }
                    })
                  }
                } catch (error) {
                  // Fallback: use coordinates directly
                  cityNames.add(cityNameLower)
                  cities.push({
                    place_id: `city_${cityData.city}_${cityData.state_id}`,
                    name: cityData.city,
                    formatted_address: formatCityForGeocoding(cityData),
                    geometry: {
                      location: {
                        lat: cityLat,
                        lng: cityLng
                      }
                    }
                  })
                }
              }
            } catch (error) {
              // Skip city on error
              console.error(`Error processing city ${cityData.city}:`, error)
            }
          }))
          
          // Small delay between batches to avoid rate limiting
          if (i + batchSize < citiesToProcess.length) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }
      } catch (error) {
        console.error('Error loading city data:', error)
        // Fallback to empty - Places API results should still work
      }
    }

    // Step 3: Filter and prepare cities
    // Places API results already include city center coordinates in geometry.location
    // Filter out duplicates and ensure we have valid locations
    const uniqueCities = new Map<string, any>()
    
    for (const city of cities) {
      // Skip if we already have this city
      if (uniqueCities.has(city.place_id)) continue
      
      // Ensure we have valid location data
      if (city.geometry && city.geometry.location) {
        const cityLat = typeof city.geometry.location.lat === 'function' 
          ? city.geometry.location.lat() 
          : city.geometry.location.lat
        const cityLng = typeof city.geometry.location.lng === 'function'
          ? city.geometry.location.lng()
          : city.geometry.location.lng
        
        // Include all cities - we'll filter by actual commute time using Distance Matrix API
        // Don't pre-filter by distance as it might exclude valid cities due to road network differences
        uniqueCities.set(city.place_id, {
          ...city,
          formatted_address: city.formatted_address || city.vicinity || city.name,
          name: city.name || city.formatted_address?.split(',')[0] || 'Unknown City',
          geometry: {
            location: {
              lat: cityLat,
              lng: cityLng,
            }
          }
        })
      }
    }

    const citiesWithCenters = Array.from(uniqueCities.values())

    if (citiesWithCenters.length === 0) {
      return NextResponse.json({ cities: [] })
    }

    // Step 3: Calculate commute times for all cities using Distance Matrix API
    // Distance Matrix API allows up to 25 destinations per request
    const batchSize = 25
    const allCityResults: any[] = []

    for (let i = 0; i < citiesWithCenters.length; i += batchSize) {
      const batch = citiesWithCenters.slice(i, i + batchSize)
      const destinations = batch.map((city: any) => {
        const lat = typeof city.geometry.location.lat === 'function' 
          ? city.geometry.location.lat() 
          : city.geometry.location.lat
        const lng = typeof city.geometry.location.lng === 'function'
          ? city.geometry.location.lng()
          : city.geometry.location.lng
        return `${lat},${lng}`
      }).join('|')

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
                const cityLat = typeof city.geometry.location.lat === 'function' 
                  ? city.geometry.location.lat() 
                  : city.geometry.location.lat
                const cityLng = typeof city.geometry.location.lng === 'function'
                  ? city.geometry.location.lng()
                  : city.geometry.location.lng
                
                allCityResults.push({
                  name: city.name || city.formatted_address?.split(',')[0] || 'Unknown City',
                  address: city.formatted_address || city.vicinity || city.name || 'Address not available',
                  location: {
                    lat: cityLat,
                    lng: cityLng,
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
                const cityLat = typeof city.geometry.location.lat === 'function' 
                  ? city.geometry.location.lat() 
                  : city.geometry.location.lat
                const cityLng = typeof city.geometry.location.lng === 'function'
                  ? city.geometry.location.lng()
                  : city.geometry.location.lng
                
                allCityResults.push({
                  name: city.name || city.formatted_address?.split(',')[0] || 'Unknown City',
                  address: city.formatted_address || city.vicinity || city.name || 'Address not available',
                  location: {
                    lat: cityLat,
                    lng: cityLng,
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

