import { NextRequest, NextResponse } from 'next/server'
import { resolveApiKey } from '@/utils/apiKeyResolver'
import { auth } from '@/auth'

function getCorsHeaders(origin: string | null): Record<string, string> {
  if (origin && origin.startsWith('chrome-extension://')) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    }
  }
  return {}
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  return NextResponse.json({}, { headers: getCorsHeaders(origin) })
}

export async function GET(request: NextRequest) {
  const session = await auth()

  // Track API usage if user is authenticated
  if (session?.user?.email) {
    try {
      const { sql } = await import('@vercel/postgres');
      // Fire and forget - don't await to keep API fast
      sql`UPDATE users SET api_calls = api_calls + 1 WHERE email = ${session.user.email}`.catch(e =>
        console.error('Failed to track API call', e)
      );
    } catch (e) {
      console.error('Failed to import postgres', e);
    }
  }

  const searchParams = request.nextUrl.searchParams
  const origin = searchParams.get('origin')
  const destination = searchParams.get('destination')
  const mode = searchParams.get('mode') || 'driving' // driving, transit, walking, bicycling
  const transitStop = searchParams.get('transitStop') // place ID or coordinates
  const leg1Mode = searchParams.get('leg1Mode') // 'walking' or 'driving'
  const transitType = searchParams.get('transitType') // 'bus' or 'train'
  const arrivalTime = searchParams.get('arrivalTime') // Unix timestamp in seconds
  const userApiKey = searchParams.get('apiKey') // Optional user API key from client

  const requestOrigin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(requestOrigin)

  if (!origin || !destination) {
    return NextResponse.json(
      { error: 'Origin and destination parameters are required' },
      { status: 400, headers: corsHeaders }
    )
  }

  try {
    const apiKey = await resolveApiKey(request, userApiKey)
    const isAuthed = !!session || !!apiKey

    if (!isAuthed) {
      return NextResponse.json(
        { error: 'Please sign in or provide a Google Maps API key' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Use server-side env key if authenticated via session (and no user key provided)
    const effectiveApiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY

    if (!effectiveApiKey) {
      return NextResponse.json(
        { error: 'Server configuration error: Google Maps API Key missing' },
        { status: 500, headers: corsHeaders }
      )
    }

    // Handle multi-leg transit journeys (origin → stop → destination)
    if (transitStop && leg1Mode && transitType) {
      // Leg 1: Calculate from origin to transit stop
      const leg1ModeParam = leg1Mode === 'walking' ? 'walking' : 'driving'
      const leg1Response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=place_id:${encodeURIComponent(transitStop)}&mode=${leg1ModeParam}&key=${effectiveApiKey}&units=imperial`
      )

      const leg1Data = await leg1Response.json()

      if (leg1Data.status !== 'OK' || leg1Data.rows[0]?.elements[0]?.status !== 'OK') {
        return NextResponse.json(
          { error: 'Failed to calculate route to transit stop', details: leg1Data.status },
          { status: 400, headers: corsHeaders }
        )
      }

      const leg1Element = leg1Data.rows[0].elements[0]

      // Leg 2: Calculate from transit stop to destination using Directions API
      // Directions API provides better transit routing with waypoints
      const transitModeParam = transitType === 'bus' ? 'bus' : 'train'
      let directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=place_id:${encodeURIComponent(transitStop)}&destination=${encodeURIComponent(destination)}&mode=transit&transit_mode=${transitModeParam}&key=${effectiveApiKey}&units=imperial`

      // Add arrival_time if provided
      if (arrivalTime) {
        directionsUrl += `&arrival_time=${arrivalTime}`
      }

      const leg2Response = await fetch(directionsUrl)
      const leg2Data = await leg2Response.json()

      if (leg2Data.status !== 'OK' || !leg2Data.routes || leg2Data.routes.length === 0) {
        let errorMessage = 'Failed to calculate transit route'
        if (leg2Data.status === 'ZERO_RESULTS') {
          errorMessage = `No ${transitType} route found from the selected stop to the destination`
        } else if (leg2Data.error_message) {
          errorMessage = leg2Data.error_message
        }
        return NextResponse.json(
          { error: errorMessage, details: leg2Data.status },
          { status: 400, headers: corsHeaders }
        )
      }

      // Get the first route (usually the best one)
      const route = leg2Data.routes[0]
      const leg2 = route.legs[0] // For transit, there's typically one leg

      // Calculate totals
      const totalDistanceValue = leg1Element.distance.value + leg2.distance.value
      const totalDurationValue = leg1Element.duration.value + leg2.duration.value

      // Format distance (convert meters to miles/feet)
      let totalDistanceText = ''
      if (totalDistanceValue < 1609.34) {
        totalDistanceText = `${Math.round(totalDistanceValue * 3.28084)} ft`
      } else {
        totalDistanceText = `${(totalDistanceValue / 1609.34).toFixed(2)} mi`
      }

      // Format duration (convert seconds to readable format)
      const totalHours = Math.floor(totalDurationValue / 3600)
      const totalMinutes = Math.floor((totalDurationValue % 3600) / 60)
      let totalDurationText = ''
      if (totalHours > 0) {
        totalDurationText = `${totalHours} hr ${totalMinutes} min`
      } else {
        totalDurationText = `${totalMinutes} min`
      }

      return NextResponse.json({
        leg1: {
          distance: leg1Element.distance.text,
          duration: leg1Element.duration.text,
          distanceValue: leg1Element.distance.value,
          durationValue: leg1Element.duration.value,
        },
        leg2: {
          distance: leg2.distance.text,
          duration: leg2.duration.text,
          distanceValue: leg2.distance.value,
          durationValue: leg2.duration.value,
        },
        total: {
          distance: totalDistanceText,
          duration: totalDurationText,
          distanceValue: totalDistanceValue,
          durationValue: totalDurationValue,
        },
        mode: 'transit',
        transitType: transitType,
      }, { headers: corsHeaders })
    }

    // Standard single-leg journey
    const modeParam = mode === 'transit' ? 'transit' : mode === 'walking' ? 'walking' : mode === 'bicycling' ? 'bicycling' : 'driving'

    // Use Directions API if arrival_time is provided (Distance Matrix doesn't support arrival_time)
    // Otherwise use Distance Matrix API for efficiency
    if (arrivalTime) {
      let directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${modeParam}&key=${effectiveApiKey}&units=imperial`

      // For transit mode, use arrival_time directly
      // For driving mode, we need to calculate departure_time
      if (modeParam === 'transit') {
        directionsUrl += `&arrival_time=${arrivalTime}`
      } else if (modeParam === 'driving') {
        // For driving, first get an estimate without time to calculate departure_time
        const estimateUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=driving&key=${effectiveApiKey}&units=imperial`
        const estimateResponse = await fetch(estimateUrl)
        const estimateData = await estimateResponse.json()

        if (estimateData.status === 'OK' && estimateData.routes && estimateData.routes.length > 0) {
          const estimatedDuration = estimateData.routes[0].legs[0].duration.value // in seconds
          const arrivalTimestamp = parseInt(arrivalTime, 10)
          const departureTimestamp = arrivalTimestamp - estimatedDuration
          // Only use departure_time if it's in the future
          if (departureTimestamp > Math.floor(Date.now() / 1000)) {
            directionsUrl += `&departure_time=${departureTimestamp}&traffic_model=best_guess`
          } else {
            // If calculated departure is in the past, use current time
            directionsUrl += `&departure_time=${Math.floor(Date.now() / 1000)}&traffic_model=best_guess`
          }
        }
      }

      const directionsResponse = await fetch(directionsUrl)
      const directionsData = await directionsResponse.json()

      if (directionsData.status === 'OK' && directionsData.routes && directionsData.routes.length > 0) {
        const route = directionsData.routes[0]
        const leg = route.legs[0]
        return NextResponse.json({
          distance: leg.distance.text,
          duration: leg.duration.text,
          distanceValue: leg.distance.value,
          durationValue: leg.duration.value,
          mode: modeParam,
        }, { headers: corsHeaders })
      } else {
        return NextResponse.json(
          { error: 'Commute calculation failed', details: directionsData.status },
          { status: 400, headers: corsHeaders }
        )
      }
    } else {
      // Use Distance Matrix API when no arrival time is specified
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=${modeParam}&key=${effectiveApiKey}&units=imperial`
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
        }, { headers: corsHeaders })
      } else {
        return NextResponse.json(
          { error: 'Commute calculation failed', details: data.status },
          { status: 400, headers: corsHeaders }
        )
      }
    }
  } catch (error) {
    console.error('Commute calculation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

