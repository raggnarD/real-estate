import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json(
      { error: 'Zillow URL parameter is required' },
      { status: 400 }
    )
  }

  try {
    // Extract Zillow property ID from URL
    const zpidMatch = url.match(/zpid[\/=](\d+)/i) || url.match(/\/(\d+)_zpid/)
    
    if (!zpidMatch) {
      return NextResponse.json(
        { error: 'Invalid Zillow URL format' },
        { status: 400 }
      )
    }

    const zpid = zpidMatch[1]

    // You can add Zillow API integration here if you have an API key
    // For now, return the extracted ZPID
    return NextResponse.json({
      zpid,
      url,
      message: 'Zillow URL processed successfully',
    })
  } catch (error) {
    console.error('Zillow processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

