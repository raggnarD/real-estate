/**
 * Safe tracked fetch that works with or without tracker
 */

import { protectedFetch } from './apiCallProtection'

interface Tracker {
  trackCall: (url: string, method: string) => string
  updateCall: (id: string, status: 'success' | 'error', duration?: number, error?: string) => void
}

interface SafeTrackedFetchOptions extends RequestInit {
  tracker?: Tracker | null
}

/**
 * Protected and tracked fetch wrapper that works with optional tracker
 */
export async function safeTrackedFetch(
  url: string,
  options?: SafeTrackedFetchOptions
): Promise<Response> {
  const method = options?.method || 'GET'
  const tracker = options?.tracker
  let callId: string | undefined
  const startTime = Date.now()

  // Track the call if tracker is provided (track BEFORE checking rate limit)
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

    // Update tracker on error (including rate limit errors)
    if (tracker && callId) {
      tracker.updateCall(callId, 'error', duration, errorMessage)
    }

    throw error
  }
}

