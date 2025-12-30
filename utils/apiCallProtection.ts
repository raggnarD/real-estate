/**
 * API Call Protection Utility
 * Prevents infinite loops and excessive API calls
 */

interface CallRecord {
  url: string
  timestamp: number
  count: number
}

class ApiCallProtection {
  private callHistory: Map<string, CallRecord> = new Map()
  private readonly MAX_CALLS_PER_WINDOW = 10 // Max calls per window
  private readonly WINDOW_MS = 60000 // 1 minute window
  private readonly MIN_INTERVAL_MS = 500 // Minimum 500ms between identical calls (reduced for polling)
  private readonly MAX_RETRIES = 3 // Maximum retries for failed calls
  
  // Endpoints that are allowed more frequent calls (polling endpoints)
  private readonly POLLING_ENDPOINTS = [
    '/api/shared-key/status',
    '/api/shared-key/get'
  ]

  /**
   * Check if an API call should be allowed
   * @param url The API endpoint URL
   * @param options Optional call options
   * @returns Object with allowed status and reason if blocked
   */
  checkCall(url: string, options?: { method?: string }): { allowed: boolean; reason?: string } {
    const now = Date.now()
    const key = `${options?.method || 'GET'}:${url}`
    const record = this.callHistory.get(key)

    // Check if this is a polling endpoint - allow more frequent calls
    const isPollingEndpoint = this.POLLING_ENDPOINTS.some(endpoint => url.includes(endpoint))
    const minInterval = isPollingEndpoint ? 5000 : this.MIN_INTERVAL_MS // 5 seconds for polling endpoints, 1 second for others

    // Check minimum interval between identical calls
    if (record && (now - record.timestamp) < minInterval) {
      const waitTimeMs = minInterval - (now - record.timestamp)
      const waitTime = waitTimeMs < 1000 ? (waitTimeMs / 1000).toFixed(1) : Math.ceil(waitTimeMs / 1000)
      return {
        allowed: false,
        reason: `Rate limit: Please wait ${waitTime}s before calling this endpoint again`
      }
    }

    // Check call count in time window
    if (record) {
      // Reset if window has passed
      if (now - record.timestamp > this.WINDOW_MS) {
        this.callHistory.set(key, { url, timestamp: now, count: 1 })
        return { allowed: true }
      }

      // Check if exceeded max calls
      if (record.count >= this.MAX_CALLS_PER_WINDOW) {
        const timeRemaining = Math.ceil((this.WINDOW_MS - (now - record.timestamp)) / 1000)
        return {
          allowed: false,
          reason: `Rate limit exceeded: ${this.MAX_CALLS_PER_WINDOW} calls per minute. Please wait ${timeRemaining}s`
        }
      }

      // Increment count
      record.count++
      record.timestamp = now
    } else {
      // First call
      this.callHistory.set(key, { url, timestamp: now, count: 1 })
    }

    return { allowed: true }
  }

  /**
   * Record a successful API call
   */
  recordCall(url: string, options?: { method?: string }): void {
    const key = `${options?.method || 'GET'}:${url}`
    const record = this.callHistory.get(key)
    if (record) {
      record.timestamp = Date.now()
    }
  }

  /**
   * Clear call history (useful for testing or reset)
   */
  clearHistory(): void {
    this.callHistory.clear()
  }

  /**
   * Get current call statistics
   */
  getStats(): { totalCalls: number; activeWindows: number } {
    const now = Date.now()
    let activeWindows = 0
    let totalCalls = 0

    for (const record of this.callHistory.values()) {
      if (now - record.timestamp <= this.WINDOW_MS) {
        activeWindows++
        totalCalls += record.count
      }
    }

    return { totalCalls, activeWindows }
  }

  /**
   * Clean up old records (call periodically)
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.callHistory.entries()) {
      if (now - record.timestamp > this.WINDOW_MS * 2) {
        this.callHistory.delete(key)
      }
    }
  }
}

// Singleton instance
export const apiCallProtection = new ApiCallProtection()

// Cleanup old records every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCallProtection.cleanup()
  }, 5 * 60 * 1000)
}

/**
 * Protected fetch wrapper
 * Automatically applies rate limiting and loop protection
 */
export async function protectedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const check = apiCallProtection.checkCall(url, { method: options?.method || 'GET' })
  
  if (!check.allowed) {
    throw new Error(check.reason || 'API call rate limited')
  }

  try {
    const response = await fetch(url, options)
    apiCallProtection.recordCall(url, { method: options?.method || 'GET' })
    return response
  } catch (error) {
    // Don't record failed calls in the same way to allow retries
    throw error
  }
}

