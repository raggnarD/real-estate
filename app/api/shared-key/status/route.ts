import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get('shared_api_key_expires')
    
    if (!cookie) {
      return NextResponse.json({
        active: false,
        expiresAt: null,
        timeRemaining: null,
        hasExpiredCookie: false
      })
    }

    const expiresAt = parseInt(cookie.value, 10)
    const now = Date.now()
    const isActive = now < expiresAt
    const timeRemaining = isActive ? expiresAt - now : null
    const hasExpiredCookie = !isActive && cookie !== undefined

    return NextResponse.json({
      active: isActive,
      expiresAt: isActive ? expiresAt : null,
      timeRemaining: timeRemaining,
      hasExpiredCookie: hasExpiredCookie
    })
  } catch (error) {
    console.error('Error checking shared key status:', error)
    return NextResponse.json(
      { error: 'Failed to check shared key status' },
      { status: 500 }
    )
  }
}

