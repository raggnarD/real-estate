import { resolveApiKey, checkSharedKeyStatus } from '../apiKeyResolver'

// Create a mock NextRequest class
class MockNextRequest {
  private cookieMap: Map<string, { value: string }>
  
  constructor(url: string, init?: { headers?: { cookie?: string } }) {
    this.cookieMap = new Map()
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
  
  get cookies() {
    return {
      get: (name: string) => {
        return this.cookieMap.get(name) || undefined
      }
    }
  }
}

// Mock NextRequest before importing the module
jest.mock('next/server', () => ({
  NextRequest: MockNextRequest
}))

// Mock environment variable
const originalEnv = process.env.GOOGLE_MAPS_API_KEY

describe('apiKeyResolver', () => {
  beforeEach(() => {
    // Reset environment variable
    delete process.env.GOOGLE_MAPS_API_KEY
  })

  afterEach(() => {
    process.env.GOOGLE_MAPS_API_KEY = originalEnv
  })

  describe('resolveApiKey', () => {
    it('should return user API key when provided', () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest('http://localhost:3000')
      const userKey = 'user-api-key-123'
      const result = resolveApiKey(request, userKey)
      expect(result).toBe(userKey)
    })

    it('should return null when no user key and no shared key cookie', () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest('http://localhost:3000')
      const result = resolveApiKey(request, null)
      expect(result).toBeNull()
    })

    it('should return shared key when valid cookie exists', () => {
      const { NextRequest } = require('next/server')
      process.env.GOOGLE_MAPS_API_KEY = 'shared-key-123'
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          cookie: `shared_api_key_expires=${expiresAt}`,
        },
      })
      const result = resolveApiKey(request, null)
      expect(result).toBe('shared-key-123')
    })

    it('should return null when shared key cookie is expired', () => {
      const { NextRequest } = require('next/server')
      process.env.GOOGLE_MAPS_API_KEY = 'shared-key-123'
      const expiresAt = Date.now() - 1000 // Expired 1 second ago
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          cookie: `shared_api_key_expires=${expiresAt}`,
        },
      })
      const result = resolveApiKey(request, null)
      expect(result).toBeNull()
    })

    it('should prioritize user key over shared key', () => {
      const { NextRequest } = require('next/server')
      process.env.GOOGLE_MAPS_API_KEY = 'shared-key-123'
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          cookie: `shared_api_key_expires=${expiresAt}`,
        },
      })
      const result = resolveApiKey(request, 'user-key-456')
      expect(result).toBe('user-key-456')
    })

    it('should trim whitespace from user key', () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest('http://localhost:3000')
      const result = resolveApiKey(request, '  user-key-123  ')
      expect(result).toBe('user-key-123')
    })
  })

  describe('checkSharedKeyStatus', () => {
    it('should return inactive when no cookie exists', () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest('http://localhost:3000')
      const status = checkSharedKeyStatus(request)
      expect(status.active).toBe(false)
      expect(status.expiresAt).toBeNull()
      expect(status.timeRemaining).toBeNull()
    })

    it('should return active when valid cookie exists', () => {
      const { NextRequest } = require('next/server')
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          cookie: `shared_api_key_expires=${expiresAt}`,
        },
      })
      const status = checkSharedKeyStatus(request)
      expect(status.active).toBe(true)
      expect(status.expiresAt).toBe(expiresAt)
      expect(status.timeRemaining).toBeGreaterThan(0)
    })

    it('should return inactive when cookie is expired', () => {
      const { NextRequest } = require('next/server')
      const expiresAt = Date.now() - 1000
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          cookie: `shared_api_key_expires=${expiresAt}`,
        },
      })
      const status = checkSharedKeyStatus(request)
      expect(status.active).toBe(false)
      expect(status.expiresAt).toBeNull()
      expect(status.timeRemaining).toBeNull()
    })

    it('should handle invalid cookie values gracefully', () => {
      const { NextRequest } = require('next/server')
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          cookie: 'shared_api_key_expires=invalid',
        },
      })
      const status = checkSharedKeyStatus(request)
      expect(status.active).toBe(false)
      expect(status.expiresAt).toBeNull()
      expect(status.timeRemaining).toBeNull()
    })
  })
})

