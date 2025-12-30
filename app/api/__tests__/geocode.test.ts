// Mock next/server before importing route
// Use factory function to avoid hoisting issues
jest.mock('next/server', () => {
  // Define MockNextRequest inside the factory
  class MockNextRequest {
    private url: URL
    private cookieMap: Map<string, { value: string }> = new Map()

    constructor(url: string, init?: { headers?: { cookie?: string } }) {
      this.url = new URL(url)
      if (init?.headers?.cookie) {
        const cookies = init.headers.cookie.split(';').map(c => c.trim())
        cookies.forEach(cookie => {
          const [name, value] = cookie.split('=')
          if (name && value) {
            this.cookieMap.set(name, { value })
          }
        })
      }
    }

    get nextUrl() {
      return {
        searchParams: this.url.searchParams,
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

  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      json: mockNextResponse.json,
    },
  }
})

// Mock the apiKeyResolver
jest.mock('@/utils/apiKeyResolver', () => ({
  resolveApiKey: jest.fn(),
}))

import { GET } from '../geocode/route'
import { resolveApiKey } from '@/utils/apiKeyResolver'

// Mock fetch
global.fetch = jest.fn()

// Export MockNextRequest for use in tests
class MockNextRequest {
  private url: URL
  private cookieMap: Map<string, { value: string }> = new Map()

  constructor(url: string, init?: { headers?: { cookie?: string } }) {
    this.url = new URL(url)
    if (init?.headers?.cookie) {
      const cookies = init.headers.cookie.split(';').map(c => c.trim())
      cookies.forEach(cookie => {
        const [name, value] = cookie.split('=')
        if (name && value) {
          this.cookieMap.set(name, { value })
        }
      })
    }
  }

  get nextUrl() {
    return {
      searchParams: this.url.searchParams,
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

describe('/api/geocode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return geocoded address when valid address is provided', async () => {
      const mockApiKey = 'test-api-key'
      ;(resolveApiKey as jest.Mock).mockReturnValue(mockApiKey)

      const mockGeocodeResponse = {
        status: 'OK',
        results: [
          {
            formatted_address: '123 Main St, Philadelphia, PA 19104, USA',
            geometry: {
              location: {
                lat: 39.9526,
                lng: -75.1652,
              },
            },
            place_id: 'ChIJ1234567890',
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockGeocodeResponse,
      })

      const request = new MockNextRequest('http://localhost:3000/api/geocode?address=123%20Main%20St')
      const response = await GET(request as any)

      expect(resolveApiKey).toHaveBeenCalledWith(request, null)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('maps.googleapis.com/maps/api/geocode/json')
      )
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('address=123%20Main%20St')
      )
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`key=${mockApiKey}`)
      )

      const responseData = await response.json()
      expect(responseData.address).toBe('123 Main St, Philadelphia, PA 19104, USA')
      expect(responseData.location).toEqual({ lat: 39.9526, lng: -75.1652 })
      expect(responseData.placeId).toBe('ChIJ1234567890')
    })

    it('should use user API key from query parameter when provided', async () => {
      const userApiKey = 'user-api-key-123'
      ;(resolveApiKey as jest.Mock).mockReturnValue(userApiKey)

      const mockGeocodeResponse = {
        status: 'OK',
        results: [
          {
            formatted_address: '456 Oak Ave, New York, NY 10001, USA',
            geometry: {
              location: { lat: 40.7128, lng: -74.006 },
            },
            place_id: 'ChIJ9876543210',
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockGeocodeResponse,
      })

      const request = new MockNextRequest('http://localhost:3000/api/geocode?address=456%20Oak%20Ave&apiKey=user-api-key-123')
      await GET(request as any)

      expect(resolveApiKey).toHaveBeenCalledWith(request, 'user-api-key-123')
    })

    it('should return 400 error when address parameter is missing', async () => {
      const request = new MockNextRequest('http://localhost:3000/api/geocode')
      const response = await GET(request as any)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Address parameter is required')
    })

    it('should return 500 error when API key is not configured', async () => {
      ;(resolveApiKey as jest.Mock).mockReturnValue(null)

      const request = new MockNextRequest('http://localhost:3000/api/geocode?address=123%20Main%20St')
      const response = await GET(request as any)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.error).toBe('Google Maps API key not configured')
    })

    it('should return 400 error when geocoding fails', async () => {
      const mockApiKey = 'test-api-key'
      ;(resolveApiKey as jest.Mock).mockReturnValue(mockApiKey)

      const mockGeocodeResponse = {
        status: 'ZERO_RESULTS',
        results: [],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockGeocodeResponse,
      })

      const request = new MockNextRequest('http://localhost:3000/api/geocode?address=InvalidAddress12345')
      const response = await GET(request as any)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Geocoding failed')
      expect(responseData.details).toBe('ZERO_RESULTS')
    })

    it('should handle network errors gracefully', async () => {
      const mockApiKey = 'test-api-key'
      ;(resolveApiKey as jest.Mock).mockReturnValue(mockApiKey)

      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const request = new MockNextRequest('http://localhost:3000/api/geocode?address=123%20Main%20St')
      const response = await GET(request as any)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.error).toBe('Internal server error')
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })
})

