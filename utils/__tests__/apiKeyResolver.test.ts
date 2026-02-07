import { resolveApiKey, checkSharedKeyStatus } from '../apiKeyResolver'

// Mock the auth module
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

import { auth } from '@/auth'

// Create a mock NextRequest class
class MockNextRequest {
  constructor(url: string) { }
  get cookies() {
    return {
      get: (name: string) => undefined
    }
  }
}

// Mock NextRequest
jest.mock('next/server', () => ({
  NextRequest: MockNextRequest
}))

describe('apiKeyResolver', () => {
  const originalEnv = process.env.GOOGLE_MAPS_API_KEY

  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.GOOGLE_MAPS_API_KEY
  })

  afterEach(() => {
    process.env.GOOGLE_MAPS_API_KEY = originalEnv
  })

  describe('resolveApiKey', () => {
    it('should return user API key when provided', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest('http://localhost:3000')
      const userKey = 'user-api-key-123'
      const result = await resolveApiKey(request, userKey)
      expect(result).toBe(userKey)
    })

    it('should return guest key when authenticated and no user key', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest('http://localhost:3000')
      process.env.GOOGLE_MAPS_API_KEY = 'server-guest-key'

        // Mock authenticated session
        ; (auth as jest.Mock).mockResolvedValue({ user: { name: 'Test User' } })

      const result = await resolveApiKey(request, null)
      expect(result).toBe('server-guest-key')
    })

    it('should return null when not authenticated and no user key', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest('http://localhost:3000')
      process.env.GOOGLE_MAPS_API_KEY = 'server-guest-key'

        // Mock unauthenticated (null session)
        ; (auth as jest.Mock).mockResolvedValue(null)

      const result = await resolveApiKey(request, null)
      expect(result).toBeNull()
    })

    it('should prioritize user key over guest key', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest('http://localhost:3000')
      process.env.GOOGLE_MAPS_API_KEY = 'server-guest-key'

        // Mock authenticated session
        ; (auth as jest.Mock).mockResolvedValue({ user: { name: 'Test User' } })

      const result = await resolveApiKey(request, 'user-key-456')
      expect(result).toBe('user-key-456')
    })
  })

  describe('checkSharedKeyStatus', () => {
    it('should return active true when authenticated', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest('http://localhost:3000')

        // Mock authenticated session
        ; (auth as jest.Mock).mockResolvedValue({ user: { name: 'Test User' } })

      const status = await checkSharedKeyStatus(request)
      expect(status.active).toBe(true)
    })

    it('should return active false when not authenticated', async () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest('http://localhost:3000')

        // Mock unauthenticated (null session)
        ; (auth as jest.Mock).mockResolvedValue(null)

      const status = await checkSharedKeyStatus(request)
      expect(status.active).toBe(false)
    })
  })
})
