import { NextRequest, NextResponse } from 'next/server'
import { resolveApiKey } from '@/utils/apiKeyResolver'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const origin = searchParams.get('origin')
  const destination = searchParams.get('destination')
  const mode = searchParams.get('mode') || 'driving' // driving, transit, walking, bicycling
  const transitStop = searchParams.get('transitStop') // place ID or coordinates
  const leg1Mode = searchParams.get('leg1Mode') // 'walking' or 'driving'
  const transitType = searchParams.get('transitType') // 'bus' or 'train'
  const userApiKey = searchParams.get('apiKey') // Optional user API key from client

  if (!origin || !destination) {
    return NextResponse.json(
      { error: 'Origin and destination parameters are required' },
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

    // Handle multi-leg transit journeys (origin → stop → destination)
    if (transitStop && leg1Mode && transitType) {
      // Leg 1: Calculate from origin to transit stop
      const leg1ModeParam = leg1Mode === 'walking' ? 'walking' : 'driving'
      const leg1Response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=place_id:${encodeURIComponent(transitStop)}&mode=${leg1ModeParam}&key=${apiKey}&units=imperial`
      )

      const leg1Data = await leg1Response.json()

      if (leg1Data.status !== 'OK' || leg1Data.rows[0]?.elements[0]?.status !== 'OK') {
        return NextResponse.json(
          { error: 'Failed to calculate route to transit stop', details: leg1Data.status },
          { status: 400 }
        )
      }

      const leg1Element = leg1Data.rows[0].elements[0]

      // Leg 2: Calculate from transit stop to destination using Directions API
      // Directions API provides better transit routing with waypoints
      const transitModeParam = transitType === 'bus' ? 'bus' : 'train'
      const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=place_id:${encodeURIComponent(transitStop)}&destination=${encodeURIComponent(destination)}&mode=transit&transit_mode=${transitModeParam}&key=${apiKey}&units=imperial`
      
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
          { status: 400 }
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
      })
    }

    // Standard single-leg journey (existing functionality)
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

