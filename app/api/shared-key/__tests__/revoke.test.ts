// Define MockNextRequest before any imports that might use it
class MockNextRequest {
  constructor() {}
}

// Mock NextResponse
const mockCookies = {
  delete: jest.fn(),
}

const mockNextResponse = {
  json: jest.fn((data: any) => {
    return {
      json: async () => data,
      cookies: mockCookies,
    }
  }),
}

// Mock next/server before importing route
jest.mock('next/server', () => ({
  NextRequest: MockNextRequest,
  NextResponse: mockNextResponse,
}))

import { POST } from '../revoke/route'

describe('/api/shared-key/revoke', () => {
  const originalConsoleError = console.error

  beforeEach(() => {
    jest.clearAllMocks()
    console.error = jest.fn()
  })

  afterEach(() => {
    console.error = originalConsoleError
  })

  describe('POST', () => {
    it('should revoke shared key and delete cookie', async () => {
      const request = new MockNextRequest()
      const response = await POST(request as any)

      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.message).toBe('Shared API key revoked successfully')

      // Check that cookie was deleted
      expect(mockCookies.delete).toHaveBeenCalledWith('shared_api_key_expires')
    })

    it('should handle errors gracefully', async () => {
      // Mock cookie.delete to throw error
      mockCookies.delete.mockImplementation(() => {
        throw new Error('Cookie error')
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const request = new MockNextRequest()
      const response = await POST(request as any)

      const responseData = await response.json()
      expect(responseData.error).toBe('Failed to revoke shared API key')
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })
})

