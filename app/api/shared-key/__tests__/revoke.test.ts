// Mock next/server before importing route
// Use factory function to avoid hoisting issues
jest.mock('next/server', () => {
  // Define MockNextRequest inside the factory
  class MockNextRequest {
    constructor() {}
  }

  // Create mock function inside factory
  const mockCookiesDelete = jest.fn()
  // Store reference on global which is always available
  if (typeof global !== 'undefined') {
    ;(global as any).__revokeMockCookiesDelete = mockCookiesDelete
  }

  const mockCookies = {
    delete: mockCookiesDelete,
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
// Access the mock function from global
const mockCookies = {
  get delete() {
    return (typeof global !== 'undefined' && (global as any).__revokeMockCookiesDelete) || jest.fn()
  },
}

// Export MockNextRequest for use in tests
class MockNextRequest {
  constructor() {}
}

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

