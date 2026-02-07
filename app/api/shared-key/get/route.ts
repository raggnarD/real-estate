import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

/**
 * Returns the guest API key only if the user is authenticated.
 * This endpoint is used by client-side components to get a functional key
 * for loading Google Maps JavaScript API without exposing it to the public.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in to access the guest API key' },
        { status: 401 }
      )
    }

    const envKey = process.env.GOOGLE_MAPS_API_KEY
    if (!envKey) {
      return NextResponse.json(
        { error: 'API key not configured on server' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      apiKey: envKey,
      expiresAt: null, // Session-based, no fixed expiration from our side
      timeRemaining: null
    })
  } catch (error) {
    console.error('Error getting guest API key:', error)
    return NextResponse.json(
      { error: 'Failed to access guest API key' },
      { status: 500 }
    )
  }
}


