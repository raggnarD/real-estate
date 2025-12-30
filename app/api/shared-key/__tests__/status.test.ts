// Define MockNextRequest before any imports that might use it
class MockNextRequest {
  private cookieMap: Map<string, { value: string }> = new Map()

  constructor(cookies?: Record<string, string>) {
    if (cookies) {
      Object.entries(cookies).forEach(([name, value]) => {
        this.cookieMap.set(name, { value })
      })
    }
  }

  get cookies() {
    return {
      get: (name: string) => {
        return this.cookieMap.get(name) || undefined
      },
    }
  }
}

// Mock NextResponse
const mockNextResponse = {
  json: jest.fn((data: any, init?: { status?: number }) => {
    return {
      json: async () => data,
      status: init?.status || 200,
    }
  }),
}

// Mock next/server before importing route
jest.mock('next/server', () => ({
  NextRequest: MockNextRequest,
  NextResponse: mockNextResponse,
}))

import { GET } from '../status/route'

describe('/api/shared-key/status', () => {
  const originalConsoleError = console.error

  beforeEach(() => {
    jest.clearAllMocks()
    console.error = jest.fn()
  })

  afterEach(() => {
    console.error = originalConsoleError
  })

  describe('GET', () => {
    it('should return inactive status when no cookie exists', async () => {
      const request = new MockNextRequest()
      const response = await GET(request as any)

      const responseData = await response.json()
      expect(responseData.active).toBe(false)
      expect(responseData.expiresAt).toBeNull()
      expect(responseData.timeRemaining).toBeNull()
      expect(responseData.hasExpiredCookie).toBe(false)
    })

    it('should return active status when cookie is valid and not expired', async () => {
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now
      const request = new MockNextRequest({
        shared_api_key_expires: expiresAt.toString(),
      })

      const response = await GET(request as any)

      const responseData = await response.json()
      expect(responseData.active).toBe(true)
      expect(responseData.expiresAt).toBe(expiresAt)
      expect(responseData.timeRemaining).toBeGreaterThan(0)
      expect(responseData.hasExpiredCookie).toBe(false)
    })

    it('should return inactive status when cookie is expired', async () => {
      const expiresAt = Date.now() - 1000 // Expired 1 second ago
      const request = new MockNextRequest({
        shared_api_key_expires: expiresAt.toString(),
      })

      const response = await GET(request as any)

      const responseData = await response.json()
      expect(responseData.active).toBe(false)
      expect(responseData.expiresAt).toBeNull()
      expect(responseData.timeRemaining).toBeNull()
      expect(responseData.hasExpiredCookie).toBe(true)
    })

    it('should calculate time remaining correctly', async () => {
      const futureTime = Date.now() + 2 * 60 * 60 * 1000 // 2 hours from now
      const request = new MockNextRequest({
        shared_api_key_expires: futureTime.toString(),
      })

      const response = await GET(request as any)

      const responseData = await response.json()
      expect(responseData.active).toBe(true)
      expect(responseData.timeRemaining).toBeGreaterThan(0)
      expect(responseData.timeRemaining).toBeLessThan(2 * 60 * 60 * 1000 + 1000) // Within 1 second
    })

    it('should handle invalid cookie values gracefully', async () => {
      const request = new MockNextRequest({
        shared_api_key_expires: 'invalid-number',
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const response = await GET(request as any)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.error).toBe('Failed to check shared key status')
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should handle errors gracefully', async () => {
      // Create a request that will cause an error
      const request = {
        cookies: {
          get: () => {
            throw new Error('Cookie error')
          },
        },
      }

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const response = await GET(request as any)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.error).toBe('Failed to check shared key status')
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })
})

