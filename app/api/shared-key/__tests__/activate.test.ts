// Mock next/server before importing route
// Use factory function to avoid hoisting issues
// Store mock function reference that both factory and tests can access
let mockCookiesSetRef: jest.Mock

jest.mock('next/server', () => {
  // Define MockNextRequest inside the factory
  class MockNextRequest {
    constructor() {}
  }

  // Create mock function inside factory
  const mockCookiesSet = jest.fn()
  // Store reference for tests to access
  mockCookiesSetRef = mockCookiesSet

  const mockCookies = {
    set: mockCookiesSet,
  }

  const mockNextResponse = {
    json: jest.fn((data: any) => {
      return {
        json: async () => data,
        cookies: mockCookies,
      }
    }),
  }

  return {
    NextRequest: MockNextRequest,
    NextResponse: mockNextResponse,
  }
})

// Create mockCookies object for tests to use
// Initialize with a fallback in case factory hasn't run yet
const mockCookies = {
  get set() {
    return mockCookiesSetRef || jest.fn()
  },
}

// Export MockNextRequest for use in tests
class MockNextRequest {
  constructor() {}
}

import { POST } from '../activate/route'

describe('/api/shared-key/activate', () => {
  const originalEnv = process.env
  const originalConsoleError = console.error
  const originalConsoleLog = console.log

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
    console.error = jest.fn()
    console.log = jest.fn()
  })

  afterEach(() => {
    process.env = originalEnv
    console.error = originalConsoleError
    console.log = originalConsoleLog
  })

  describe('POST', () => {
    it('should activate shared key and set cookie when API key is configured', async () => {
      process.env.GOOGLE_MAPS_API_KEY = 'test-api-key-123'
      process.env.NODE_ENV = 'production'

      const request = new MockNextRequest()
      const response = await POST(request as any)

      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.expiresAt).toBeGreaterThan(Date.now())
      expect(responseData.message).toBe('24-hour shared API key activated successfully')

      // Check that cookie was set
      expect(mockCookies.set).toHaveBeenCalledWith(
        'shared_api_key_expires',
        expect.any(String),
        {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 86400,
          path: '/',
        }
      )

      // Verify expiration is approximately 24 hours from now
      const expiresAt = parseInt(mockCookies.set.mock.calls[0][1])
      const expectedExpiresAt = Date.now() + 24 * 60 * 60 * 1000
      expect(Math.abs(expiresAt - expectedExpiresAt)).toBeLessThan(1000) // Within 1 second
    })

    it('should set secure cookie to false in development', async () => {
      process.env.GOOGLE_MAPS_API_KEY = 'test-api-key-123'
      process.env.NODE_ENV = 'development'

      const request = new MockNextRequest()
      await POST(request as any)

      expect(mockCookies.set).toHaveBeenCalledWith(
        'shared_api_key_expires',
        expect.any(String),
        expect.objectContaining({
          secure: false,
        })
      )
    })

    it('should return 500 error when API key is not configured', async () => {
      delete process.env.GOOGLE_MAPS_API_KEY
      process.env.NODE_ENV = 'production'

      const request = new MockNextRequest()
      const response = await POST(request as any)

      const responseData = await response.json()
      expect(responseData.error).toContain('Shared API key not configured')
      expect(console.error).toHaveBeenCalledWith(
        'GOOGLE_MAPS_API_KEY environment variable is not set'
      )
    })

    it('should provide development-specific error message', async () => {
      delete process.env.GOOGLE_MAPS_API_KEY
      process.env.NODE_ENV = 'development'

      const request = new MockNextRequest()
      const response = await POST(request as any)

      const responseData = await response.json()
      expect(responseData.details).toContain('development environment')
      expect(responseData.details).toContain('.env.local')
    })

    it('should provide production-specific error message', async () => {
      delete process.env.GOOGLE_MAPS_API_KEY
      process.env.NODE_ENV = 'production'

      const request = new MockNextRequest()
      const response = await POST(request as any)

      const responseData = await response.json()
      expect(responseData.details).toContain('Vercel project settings')
    })

    it('should log API key info in development mode', async () => {
      process.env.GOOGLE_MAPS_API_KEY = 'test-api-key-123'
      process.env.NODE_ENV = 'development'

      const request = new MockNextRequest()
      await POST(request as any)

      expect(console.log).toHaveBeenCalledWith('GOOGLE_MAPS_API_KEY exists:', true)
      expect(console.log).toHaveBeenCalledWith('GOOGLE_MAPS_API_KEY length:', 15)
    })

    it('should handle errors gracefully', async () => {
      process.env.GOOGLE_MAPS_API_KEY = 'test-api-key-123'
      process.env.NODE_ENV = 'production'

      // Mock cookie.set to throw error
      mockCookies.set.mockImplementation(() => {
        throw new Error('Cookie error')
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const request = new MockNextRequest()
      const response = await POST(request as any)

      const responseData = await response.json()
      expect(responseData.error).toBe('Failed to activate shared API key')
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })
})

