import { NextRequest, NextResponse } from 'next/server'
import { checkSharedKeyStatus } from '@/utils/apiKeyResolver'

/**
 * Returns the shared API key only if the user has an active consent cookie.
 * This endpoint is used by client-side components to get the shared key
 * for loading Google Maps JavaScript API.
 */
export async function GET(request: NextRequest) {
  try {
    const status = checkSharedKeyStatus(request)
    
    if (!status.active) {
      return NextResponse.json(
        { error: 'Shared API key not active or expired' },
        { status: 403 }
      )
    }

    // Only return the key if cookie is valid
    const envKey = process.env.GOOGLE_MAPS_API_KEY
    if (!envKey) {
      return NextResponse.json(
        { error: 'Shared API key not configured on server' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      apiKey: envKey,
      expiresAt: status.expiresAt,
      timeRemaining: status.timeRemaining
    })
  } catch (error) {
    console.error('Error getting shared API key:', error)
    return NextResponse.json(
      { error: 'Failed to get shared API key' },
      { status: 500 }
    )
  }
}

