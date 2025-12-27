import { NextRequest, NextResponse } from 'next/server'
import { resolveApiKey } from '@/utils/apiKeyResolver'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const width = searchParams.get('width') || '400'
  const height = searchParams.get('height') || '300'
  const fov = searchParams.get('fov') || '90'
  const heading = searchParams.get('heading') || '0'
  const pitch = searchParams.get('pitch') || '0'
  const userApiKey = searchParams.get('apiKey') // Optional user API key from client

  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'Latitude and longitude parameters are required' },
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

    // Try to fetch the image directly first (metadata API might have different restrictions)
    // If that fails, we'll check metadata for more details
    const imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=${width}x${height}&location=${lat},${lng}&fov=${fov}&heading=${heading}&pitch=${pitch}&key=${apiKey}`
    
    // Fetch the image first
    const imageResponse = await fetch(imageUrl)
    const contentType = imageResponse.headers.get('content-type')
    
    // If we got an image, return it immediately
    if (imageResponse.ok && contentType?.startsWith('image/')) {
      const imageBuffer = await imageResponse.arrayBuffer()
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }
    
    // If not an image, check if it's a JSON error response
    if (contentType?.includes('application/json')) {
      const errorData = await imageResponse.json()
      console.error('Street View Image API Error:', errorData)
      
      // Handle specific error cases
      if (errorData.status === 'REQUEST_DENIED') {
        const errorMsg = errorData.error_message || 'Street View API access denied'
        console.error('Street View API Request Denied:', errorMsg)
        
        // Check metadata API for more details (sometimes it provides better error messages)
        try {
          const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${apiKey}`
          const metadataResponse = await fetch(metadataUrl)
          const metadataData = await metadataResponse.json()
          
          console.log('Street View Metadata Response:', {
            status: metadataData.status,
            location: `${lat},${lng}`,
            data: metadataData
          })
          
          // If metadata also says REQUEST_DENIED, it's likely an API key issue
          if (metadataData.status === 'REQUEST_DENIED') {
            return NextResponse.json(
              { 
                error: 'Street View API access denied. The Street View Static API may not be fully enabled yet, or there may be API key restrictions.',
                status: metadataData.status,
                details: metadataData.error_message || errorMsg,
                suggestion: 'Wait a few minutes after enabling the API, or check API key restrictions in Google Cloud Console'
              },
              { status: 403 }
            )
          }
        } catch (metadataError) {
          console.error('Error checking metadata:', metadataError)
        }
        
        return NextResponse.json(
          { 
            error: errorMsg,
            status: errorData.status,
            details: 'This API project is not authorized to use this API. Please ensure Street View Static API is enabled and wait a few minutes for changes to propagate.',
            suggestion: 'Check Google Cloud Console > APIs & Services > Enabled APIs to verify Street View Static API is enabled'
          },
          { status: 403 }
        )
      }
      
      if (errorData.status === 'ZERO_RESULTS') {
        return NextResponse.json(
          { 
            error: 'Street View imagery is not available for this location',
            status: errorData.status,
            suggestion: 'Try a different address or location'
          },
          { status: 404 }
        )
      }
      
      if (errorData.status === 'OVER_QUERY_LIMIT') {
        return NextResponse.json(
          { 
            error: 'Street View API quota exceeded',
            status: errorData.status
          },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { 
          error: errorData.error_message || `Street View API error: ${errorData.status}`,
          status: errorData.status,
          details: errorData
        },
        { status: 400 }
      )
    }
    
    // Fallback: check metadata API for more information
    try {
      const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${apiKey}`
      const metadataResponse = await fetch(metadataUrl)
      const metadataData = await metadataResponse.json()

      console.log('Street View Metadata Response:', {
        status: metadataData.status,
        location: `${lat},${lng}`,
        data: metadataData
      })

      if (metadataData.status === 'ZERO_RESULTS') {
        return NextResponse.json(
          { 
            error: 'Street View imagery is not available for this location',
            status: metadataData.status,
            suggestion: 'Try a different address or location'
          },
          { status: 404 }
        )
      }

      if (metadataData.status === 'REQUEST_DENIED') {
        return NextResponse.json(
          { 
            error: 'Street View API access denied. The API may not be fully enabled yet.',
            status: metadataData.status,
            details: metadataData.error_message || 'Wait a few minutes after enabling the API for changes to propagate',
            suggestion: 'Check Google Cloud Console to ensure Street View Static API is enabled'
          },
          { status: 403 }
        )
      }
    } catch (metadataError) {
      console.error('Error checking metadata:', metadataError)
    }

    // If we get here, something unexpected happened
    return NextResponse.json(
      { 
        error: 'Failed to fetch Street View image',
        status: imageResponse.status,
        statusText: imageResponse.statusText
      },
      { status: imageResponse.status || 500 }
    )
  } catch (error) {
    console.error('Street View API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

