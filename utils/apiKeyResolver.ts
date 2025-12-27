import { NextRequest } from 'next/server'

/**
 * Resolves the API key to use for Google Maps API calls
 * Priority: user's API key > shared key cookie (if valid) > environment variable
 * 
 * @param request - Next.js request object
 * @param userApiKey - Optional user-provided API key from client
 * @returns The resolved API key or null if none available
 */
export function resolveApiKey(request: NextRequest, userApiKey?: string | null): string | null {
  // Priority 1: User's own API key (if provided)
  if (userApiKey && userApiKey.trim()) {
    return userApiKey.trim()
  }

  // Priority 2: Shared key cookie (if valid and not expired)
  const sharedKeyCookie = request.cookies.get('shared_api_key_expires')
  if (sharedKeyCookie) {
    try {
      const expiresAt = parseInt(sharedKeyCookie.value, 10)
      const now = Date.now()
      
      // Check if cookie is still valid (not expired)
      if (now < expiresAt) {
        const envKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (envKey) {
          return envKey // Use shared key from environment
        }
      }
    } catch (error) {
      console.error('Error parsing shared key cookie:', error)
      // Fall through to environment variable
    }
  }

  // Priority 3: Environment variable (fallback)
  const envKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (envKey) {
    return envKey
  }

  // No API key available
  return null
}

/**
 * Checks if a shared key cookie is active and valid
 * 
 * @param request - Next.js request object
 * @returns Object with active status, expiration time, and time remaining
 */
export function checkSharedKeyStatus(request: NextRequest) {
  const cookie = request.cookies.get('shared_api_key_expires')
  
  if (!cookie) {
    return {
      active: false,
      expiresAt: null,
      timeRemaining: null
    }
  }

  try {
    const expiresAt = parseInt(cookie.value, 10)
    const now = Date.now()
    const isActive = now < expiresAt
    const timeRemaining = isActive ? expiresAt - now : null

    return {
      active: isActive,
      expiresAt: isActive ? expiresAt : null,
      timeRemaining: timeRemaining
    }
  } catch (error) {
    console.error('Error checking shared key status:', error)
    return {
      active: false,
      expiresAt: null,
      timeRemaining: null
    }
  }
}

