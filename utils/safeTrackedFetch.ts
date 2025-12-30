/**
 * Safe protected fetch wrapper
 * Applies rate limiting and loop protection without tracking
 */

import { protectedFetch } from './apiCallProtection'

/**
 * Protected fetch wrapper that applies rate limiting and loop protection
 */
export async function safeTrackedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  // Use protected fetch which applies rate limiting and loop protection
  return await protectedFetch(url, options)
}

