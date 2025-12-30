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
    NextResponse: mockNextResponse,
  }
})

// Mock the apiKeyResolver
jest.mock('@/utils/apiKeyResolver', () => ({
  resolveApiKey: jest.fn(),
}))

import { GET } from '../commute/route'
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

describe('/api/commute', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return commute time for standard journey', async () => {
      const mockApiKey = 'test-api-key'
      ;(resolveApiKey as jest.Mock).mockReturnValue(mockApiKey)

      const mockDistanceMatrixResponse = {
        status: 'OK',
        rows: [
          {
            elements: [
              {
                status: 'OK',
                distance: { text: '10.5 mi', value: 16898 },
                duration: { text: '25 mins', value: 1500 },
              },
            ],
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockDistanceMatrixResponse,
      })

      const request = new MockNextRequest(
        'http://localhost:3000/api/commute?origin=40.7128,-74.006&destination=40.7589,-73.9851&mode=driving'
      )
      const response = await GET(request as any)

      expect(resolveApiKey).toHaveBeenCalled()
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('maps.googleapis.com/maps/api/distancematrix/json')
      )

      const responseData = await response.json()
      expect(responseData.distance).toBe('10.5 mi')
      expect(responseData.duration).toBe('25 mins')
      expect(responseData.distanceValue).toBe(16898)
      expect(responseData.durationValue).toBe(1500)
      expect(responseData.mode).toBe('driving')
    })

    it('should return 400 error when origin is missing', async () => {
      const request = new MockNextRequest(
        'http://localhost:3000/api/commute?destination=40.7589,-73.9851'
      )
      const response = await GET(request as any)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Origin and destination parameters are required')
    })

    it('should return 400 error when destination is missing', async () => {
      const request = new MockNextRequest(
        'http://localhost:3000/api/commute?origin=40.7128,-74.006'
      )
      const response = await GET(request as any)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Origin and destination parameters are required')
    })

    it('should return 500 error when API key is not configured', async () => {
      ;(resolveApiKey as jest.Mock).mockReturnValue(null)

      const request = new MockNextRequest(
        'http://localhost:3000/api/commute?origin=40.7128,-74.006&destination=40.7589,-73.9851'
      )
      const response = await GET(request as any)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.error).toBe('Google Maps API key not configured')
    })

    it('should handle different travel modes', async () => {
      const mockApiKey = 'test-api-key'
      ;(resolveApiKey as jest.Mock).mockReturnValue(mockApiKey)

      const modes = ['driving', 'walking', 'bicycling', 'transit']
      
      for (const mode of modes) {
        ;(global.fetch as jest.Mock).mockResolvedValue({
          json: async () => ({
            status: 'OK',
            rows: [
              {
                elements: [
                  {
                    status: 'OK',
                    distance: { text: '5 mi', value: 8047 },
                    duration: { text: '15 mins', value: 900 },
                  },
                ],
              },
            ],
          }),
        })

        const request = new MockNextRequest(
          `http://localhost:3000/api/commute?origin=40.7128,-74.006&destination=40.7589,-73.9851&mode=${mode}`
        )
        const response = await GET(request as any)

        const responseData = await response.json()
        expect(responseData.mode).toBe(mode === 'transit' ? 'transit' : mode)
      }
    })

    it('should handle transit journey with stop', async () => {
      const mockApiKey = 'test-api-key'
      ;(resolveApiKey as jest.Mock).mockReturnValue(mockApiKey)

      const mockLeg1Response = {
        status: 'OK',
        rows: [
          {
            elements: [
              {
                status: 'OK',
                distance: { text: '0.5 mi', value: 805 },
                duration: { text: '10 mins', value: 600 },
              },
            ],
          },
        ],
      }

      const mockLeg2Response = {
        status: 'OK',
        routes: [
          {
            legs: [
              {
                distance: { text: '15 mi', value: 24140 },
                duration: { text: '45 mins', value: 2700 },
              },
            ],
          },
        ],
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => mockLeg1Response,
        })
        .mockResolvedValueOnce({
          json: async () => mockLeg2Response,
        })

      const request = new MockNextRequest(
        'http://localhost:3000/api/commute?origin=40.7128,-74.006&destination=40.7589,-73.9851&transitStop=ChIJ123&leg1Mode=walking&transitType=bus'
      )
      const response = await GET(request as any)

      const responseData = await response.json()
      expect(responseData.mode).toBe('transit')
      expect(responseData.transitType).toBe('bus')
      expect(responseData.leg1).toBeDefined()
      expect(responseData.leg2).toBeDefined()
      expect(responseData.total).toBeDefined()
    })

    it('should return 400 error when commute calculation fails', async () => {
      const mockApiKey = 'test-api-key'
      ;(resolveApiKey as jest.Mock).mockReturnValue(mockApiKey)

      const mockDistanceMatrixResponse = {
        status: 'ZERO_RESULTS',
        rows: [
          {
            elements: [
              {
                status: 'ZERO_RESULTS',
              },
            ],
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockDistanceMatrixResponse,
      })

      const request = new MockNextRequest(
        'http://localhost:3000/api/commute?origin=40.7128,-74.006&destination=40.7589,-73.9851'
      )
      const response = await GET(request as any)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Commute calculation failed')
    })

    it('should handle network errors gracefully', async () => {
      const mockApiKey = 'test-api-key'
      ;(resolveApiKey as jest.Mock).mockReturnValue(mockApiKey)

      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const request = new MockNextRequest(
        'http://localhost:3000/api/commute?origin=40.7128,-74.006&destination=40.7589,-73.9851'
      )
      const response = await GET(request as any)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.error).toBe('Internal server error')
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })
})

