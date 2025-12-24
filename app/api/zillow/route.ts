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

    // Extract address from URL path
    // URL format: https://www.zillow.com/homedetails/418-Glenway-Rd-Erdenheim-PA-19038/10012557_zpid/
    // Address is in the path: 418-Glenway-Rd-Erdenheim-PA-19038
    let address = ''
    try {
      const urlPath = new URL(url).pathname
      const pathParts = urlPath.split('/').filter(part => part && !part.match(/^\d+_zpid$/) && part !== 'homedetails')
      
      if (pathParts.length > 0) {
        // The address is typically the last part before the zpid
        const addressPart = pathParts[pathParts.length - 1]
        // Convert hyphens to spaces
        const addressWords = addressPart.split('-')
        
        if (addressWords.length >= 5) {
          // Pattern: StreetNumber-StreetName-StreetType-City-State-Zip
          // Example: 418-Glenway-Rd-Erdenheim-PA-19038
          const streetNumber = addressWords[0]
          const streetName = addressWords[1]
          const streetType = addressWords[2]
          const city = addressWords[3]
          const state = addressWords[4].toUpperCase()
          const zip = addressWords.length > 5 ? addressWords[5] : ''
          
          // Capitalize street name and city properly
          const capitalizeWord = (word: string) => {
            if (!word) return ''
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          }
          
          // Capitalize street type abbreviations
          const streetTypeAbbrev: { [key: string]: string } = {
            'rd': 'Rd',
            'st': 'St',
            'ave': 'Ave',
            'ave.': 'Ave',
            'blvd': 'Blvd',
            'dr': 'Dr',
            'ln': 'Ln',
            'ct': 'Ct',
            'pl': 'Pl',
            'way': 'Way',
            'cir': 'Cir',
            'pkwy': 'Pkwy',
          }
          
          const formattedStreetType = streetTypeAbbrev[streetType.toLowerCase()] || capitalizeWord(streetType)
          
          // Reconstruct address
          address = [
            `${streetNumber} ${capitalizeWord(streetName)} ${formattedStreetType}`,
            capitalizeWord(city),
            state,
            zip
          ].filter(Boolean).join(', ')
        } else {
          // Fallback: just join with spaces and capitalize
          address = addressWords
            .map((word, index) => {
              if (index === 0 && /^\d+$/.test(word)) {
                return word // Keep numbers as-is
              }
              return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            })
            .join(' ')
        }
      }
    } catch (urlError) {
      console.error('Error parsing Zillow URL:', urlError)
      // If URL parsing fails, try a simpler regex approach
      const addressMatch = url.match(/homedetails\/([^\/]+)\//)
      if (addressMatch) {
        address = addressMatch[1]
          .split('-')
          .map((word, index) => {
            if (index === 0 && /^\d+$/.test(word)) {
              return word
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          })
          .join(' ')
      }
    }

    return NextResponse.json({
      zpid,
      url,
      address: address || null,
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


