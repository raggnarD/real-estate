// Mock next/server before importing route
// Use factory function to avoid hoisting issues
jest.mock('next/server', () => {
  // Define MockNextRequest inside the factory
  class MockNextRequest {
    constructor() {}
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

  return {
    NextRequest: MockNextRequest,
    NextResponse: mockNextResponse,
  }
})

// Mock the apiKeyResolver
jest.mock('@/utils/apiKeyResolver', () => ({
  checkSharedKeyStatus: jest.fn(),
}))

import { GET } from '../get/route'
import { checkSharedKeyStatus } from '@/utils/apiKeyResolver'

// Export MockNextRequest for use in tests
class MockNextRequest {
  constructor() {}
}

describe('/api/shared-key/get', () => {
  const originalEnv = process.env
  const originalConsoleError = console.error

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
    console.error = jest.fn()
  })

  afterEach(() => {
    process.env = originalEnv
    console.error = originalConsoleError
  })

  describe('GET', () => {
    it('should return API key when shared key is active', async () => {
      process.env.GOOGLE_MAPS_API_KEY = 'shared-api-key-123'
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000
      const timeRemaining = 24 * 60 * 60 * 1000

      ;(checkSharedKeyStatus as jest.Mock).mockReturnValue({
        active: true,
        expiresAt,
        timeRemaining,
      })

      const request = new MockNextRequest()
      const response = await GET(request as any)

      const responseData = await response.json()
      expect(responseData.apiKey).toBe('shared-api-key-123')
      expect(responseData.expiresAt).toBe(expiresAt)
      expect(responseData.timeRemaining).toBe(timeRemaining)
    })

    it('should return 403 error when shared key is not active', async () => {
      ;(checkSharedKeyStatus as jest.Mock).mockReturnValue({
        active: false,
        expiresAt: null,
        timeRemaining: null,
      })

      const request = new MockNextRequest()
      const response = await GET(request as any)

      expect(response.status).toBe(403)
      const responseData = await response.json()
      expect(responseData.error).toBe('Shared API key not active or expired')
    })

    it('should return 500 error when API key is not configured', async () => {
      delete process.env.GOOGLE_MAPS_API_KEY

      ;(checkSharedKeyStatus as jest.Mock).mockReturnValue({
        active: true,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        timeRemaining: 24 * 60 * 60 * 1000,
      })

      const request = new MockNextRequest()
      const response = await GET(request as any)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.error).toBe('Shared API key not configured on server')
    })

    it('should handle errors gracefully', async () => {
      ;(checkSharedKeyStatus as jest.Mock).mockImplementation(() => {
        throw new Error('Test error')
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const request = new MockNextRequest()
      const response = await GET(request as any)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.error).toBe('Failed to get shared API key')
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })
})

