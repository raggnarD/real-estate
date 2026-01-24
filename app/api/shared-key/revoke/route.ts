import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Shared API key revoked successfully'
    })

    // Clear the cookie
    response.cookies.delete('shared_api_key_expires')

    return response
  } catch (error) {
    console.error('Error revoking shared API key:', error)
    return NextResponse.json(
      { error: 'Failed to revoke shared API key' },
      { status: 500 }
    )
  }
}



