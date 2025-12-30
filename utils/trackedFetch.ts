/**
 * Tracked and Protected Fetch Utility
 * Combines API call protection with tracking
 */

import { protectedFetch } from './apiCallProtection'

interface TrackedFetchOptions extends RequestInit {
  tracker?: {
    trackCall: (url: string, method: string) => string
    updateCall: (id: string, status: 'success' | 'error', duration?: number, error?: string) => void
  }
}

/**
 * Protected and tracked fetch wrapper
 * Applies rate limiting, loop protection, and tracks API calls
 */
export async function trackedFetch(
  url: string,
  options?: TrackedFetchOptions
): Promise<Response> {
  const method = options?.method || 'GET'
  const tracker = options?.tracker
  let callId: string | undefined
  const startTime = Date.now()

  // Track the call if tracker is provided
  if (tracker) {
    callId = tracker.trackCall(url, method)
  }

  // Destructure tracker out of options to pass clean RequestInit to protectedFetch
  const { tracker: _, ...fetchOptions } = options || {}

  try {
    // Use protected fetch which applies rate limiting
    const response = await protectedFetch(url, fetchOptions)
    const duration = Date.now() - startTime

    // Update tracker on success
    if (tracker && callId) {
      tracker.updateCall(callId, 'success', duration)
    }

    return response
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Update tracker on error
    if (tracker && callId) {
      tracker.updateCall(callId, 'error', duration, errorMessage)
    }

    throw error
  }
}

