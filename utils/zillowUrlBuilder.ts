/**
 * Builds a Zillow URL from a city address string
 * 
 * Examples:
 * - "Lower Merion Township, PA, USA" → "https://www.zillow.com/lower-merion-township-pa/"
 * - "Cornwells Heights, Bensalem, PA, USA" → "https://www.zillow.com/cornwells-heights-bensalem-pa/"
 * - "Philadelphia, PA, USA" → "https://www.zillow.com/philadelphia-pa/"
 * 
 * @param address - Full address string from Google Geocoding API (e.g., "City, State, Country")
 * @param cityName - Optional city name to use as fallback if address parsing fails
 * @returns Formatted Zillow URL
 */
export function buildZillowUrl(address: string, cityName?: string): string {
  if (!address || address.trim() === '') {
    // Fallback to city name if provided
    if (cityName) {
      return formatLocationForZillow(cityName, '')
    }
    return 'https://www.zillow.com/'
  }

  // Split address by commas and clean up
  const parts = address
    .split(',')
    .map(part => part.trim())
    .filter(part => part.length > 0)

  if (parts.length === 0) {
    // Fallback to city name if provided
    if (cityName) {
      return formatLocationForZillow(cityName, '')
    }
    return 'https://www.zillow.com/'
  }

  // Find state (typically a 2-letter abbreviation, usually second-to-last or last before country)
  let state = ''
  let stateIndex = -1
  
  // Look for 2-letter state abbreviation (US states)
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i].toUpperCase().trim()
    // Check if it's a 2-letter state code
    if (part.length === 2 && /^[A-Z]{2}$/.test(part)) {
      state = parts[i].toLowerCase()
      stateIndex = i
      break
    }
    // Check if part contains state + zip code (e.g., "PA 19020")
    const stateZipMatch = part.match(/^([A-Z]{2})\s+(\d{5}|\d{5}-\d{4})$/)
    if (stateZipMatch) {
      state = stateZipMatch[1].toLowerCase()
      stateIndex = i
      break
    }
  }

  // If no state found, try to extract from last part before country indicators
  if (!state && parts.length >= 2) {
    const lastPart = parts[parts.length - 1].toUpperCase()
    // Skip common country indicators
    if (lastPart === 'USA' || lastPart === 'US' || lastPart === 'UNITED STATES') {
      if (parts.length >= 2) {
        const potentialStatePart = parts[parts.length - 2].toUpperCase().trim()
        // Check if it's just a 2-letter state
        if (potentialStatePart.length === 2 && /^[A-Z]{2}$/.test(potentialStatePart)) {
          state = parts[parts.length - 2].toLowerCase()
          stateIndex = parts.length - 2
        } else {
          // Check if it contains state + zip (e.g., "PA 19020")
          const stateZipMatch = potentialStatePart.match(/^([A-Z]{2})\s+(\d{5}|\d{5}-\d{4})$/)
          if (stateZipMatch) {
            state = stateZipMatch[1].toLowerCase()
            stateIndex = parts.length - 2
          }
        }
      }
    }
  }

  // Extract location parts (everything before state, excluding zip codes)
  let locationParts: string[] = []
  
  if (stateIndex > 0) {
    // Take everything before state as location
    locationParts = parts.slice(0, stateIndex)
  } else if (parts.length >= 2) {
    // If no state found but we have multiple parts, use all but the last (which might be country)
    const lastPart = parts[parts.length - 1].toUpperCase()
    if (lastPart === 'USA' || lastPart === 'US' || lastPart === 'UNITED STATES') {
      // Check if second-to-last part contains state+zip, if so exclude it
      const secondToLast = parts[parts.length - 2].toUpperCase().trim()
      if (secondToLast.match(/^[A-Z]{2}\s+(\d{5}|\d{5}-\d{4})$/)) {
        // Extract state from this part and exclude it from location
        locationParts = parts.slice(0, parts.length - 2)
      } else {
        locationParts = parts.slice(0, parts.length - 1)
      }
    } else {
      locationParts = parts.slice(0, parts.length)
    }
  } else {
    locationParts = parts
  }

  // Remove any zip codes from location parts (standalone 5-digit numbers)
  locationParts = locationParts.filter(part => {
    const trimmed = part.trim()
    // Filter out standalone zip codes (5 digits or 5+4 format)
    return !/^\d{5}(-\d{4})?$/.test(trimmed)
  })

  // Handle different address formats
  let locationString = ''
  
  if (locationParts.length === 0) {
    // No location parts found, use city name as fallback
    locationString = cityName || ''
  } else if (locationParts.length === 1) {
    // Single part: just city name
    locationString = locationParts[0]
  } else if (locationParts.length >= 2) {
    // Multiple parts: could be "Neighborhood, City" or "City, County" etc.
    // For Zillow, we typically want: neighborhood-city or just city
    // If we have 2+ parts, combine them (neighborhood-city format)
    locationString = locationParts.join(' ')
  }

  return formatLocationForZillow(locationString, state)
}

/**
 * Formats location string and state for Zillow URL
 * 
 * @param location - City/neighborhood name(s)
 * @param state - State abbreviation (2 letters)
 * @returns Formatted Zillow URL
 */
function formatLocationForZillow(location: string, state: string): string {
  if (!location || location.trim() === '') {
    return 'https://www.zillow.com/'
  }

  // Format location: lowercase, replace spaces with hyphens, remove special characters
  let formatted = location
    .toLowerCase()
    .trim()
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Replace spaces with hyphens
    .replace(/\s/g, '-')
    // Remove special characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')

  // Format state: lowercase, remove non-alphabetic characters
  const formattedState = state
    .toLowerCase()
    .trim()
    .replace(/[^a-z]/g, '')

  // Build URL
  if (formattedState && formattedState.length === 2) {
    return `https://www.zillow.com/${formatted}-${formattedState}/`
  } else if (formatted) {
    // If no valid state, just use location
    return `https://www.zillow.com/${formatted}/`
  }

  return 'https://www.zillow.com/'
}

