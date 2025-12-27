import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Check if environment API key is available (server-side only, not exposed to client)
    const envKey = process.env.GOOGLE_MAPS_API_KEY
    if (!envKey) {
      return NextResponse.json(
        { error: 'Shared API key not configured on server' },
        { status: 500 }
      )
    }

    // Calculate expiration time (24 hours from now)
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000) // 24 hours in milliseconds

    // Create response
    const response = NextResponse.json({
      success: true,
      expiresAt,
      message: '24-hour shared API key activated successfully'
    })

    // Set HTTP-only cookie with expiration
    response.cookies.set('shared_api_key_expires', expiresAt.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400, // 24 hours in seconds
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Error activating shared API key:', error)
    return NextResponse.json(
      { error: 'Failed to activate shared API key' },
      { status: 500 }
    )
  }
}


