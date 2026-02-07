import { NextRequest } from 'next/server'
import { auth } from '@/auth'

/**
 * Resolves the API key to use for Google Maps API calls
 * Priority: user's API key > server guest key (if authenticated)
 * 
 * @param request - Next.js request object
 * @param userApiKey - Optional user-provided API key from client
 * @returns The resolved API key or null if none available
 */
export async function resolveApiKey(request: NextRequest, userApiKey?: string | null): Promise<string | null> {
  // Priority 1: User's own API key (if provided)
  if (userApiKey && userApiKey.trim()) {
    return userApiKey.trim()
  }

  // Priority 2: Server guest key (if user is authenticated)
  try {
    const session = await auth()
    if (session) {
      const envKey = process.env.GOOGLE_MAPS_API_KEY
      if (envKey) {
        return envKey
      }
    }
  } catch (error) {
    console.error('Error resolving guest API key:', error)
  }

  // No API key available
  return null
}

/**
 * Checks if the user is authenticated and has access to the guest key
 * (Legacy support for components that expect this shape)
 */
export async function checkSharedKeyStatus(request: NextRequest) {
  try {
    const session = await auth()
    const isActive = !!session

    return {
      active: isActive,
      expiresAt: null, // Session-based
      timeRemaining: null
    }
  } catch (error) {
    console.error('Error checking guest key status:', error)
    return {
      active: false,
      expiresAt: null,
      timeRemaining: null
    }
  }
}
