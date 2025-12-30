/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { ApiKeyProvider, useApiKey } from '../ApiKeyContext'

// Mock fetch
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('ApiKeyContext', () => {
  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ApiKeyProvider>{children}</ApiKeyProvider>
  )

  describe('API Key Management', () => {
    it('should load API key from localStorage on mount', async () => {
      localStorageMock.setItem('google_maps_api_key', 'test-key-123')
      
      const { result } = renderHook(() => useApiKey(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.apiKey).toBe('test-key-123')
    })

    it('should set API key and save to localStorage', async () => {
      const { result } = renderHook(() => useApiKey(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.setApiKey('new-api-key')
      })

      expect(result.current.apiKey).toBe('new-api-key')
      expect(localStorageMock.getItem('google_maps_api_key')).toBe('new-api-key')
    })

    it('should remove API key from localStorage when set to null', async () => {
      localStorageMock.setItem('google_maps_api_key', 'existing-key')
      
      const { result } = renderHook(() => useApiKey(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.setApiKey(null)
      })

      expect(result.current.apiKey).toBeNull()
      expect(localStorageMock.getItem('google_maps_api_key')).toBeNull()
    })
  })

  describe('Shared Key Management', () => {
    it('should check shared key status on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          active: true,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          timeRemaining: 24 * 60 * 60 * 1000,
          hasExpiredCookie: false,
        }),
      })

      const { result } = renderHook(() => useApiKey(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/shared-key/status', {
        method: 'GET',
        credentials: 'include',
      })
    })

    it('should activate shared key', async () => {
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            active: true,
            expiresAt,
            timeRemaining: 24 * 60 * 60 * 1000,
            hasExpiredCookie: false,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ apiKey: 'shared-key-123' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            active: true,
            expiresAt,
            timeRemaining: 24 * 60 * 60 * 1000,
            hasExpiredCookie: false,
          }),
        })

      const { result } = renderHook(() => useApiKey(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.activateSharedKey()
      })

      expect(result.current.sharedKeyActive).toBe(true)
      expect(result.current.sharedKeyExpiresAt).toBe(expiresAt)
      expect(global.fetch).toHaveBeenCalledWith('/api/shared-key/activate', {
        method: 'POST',
        credentials: 'include',
      })
    })

    it('should handle shared key activation failure', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            active: false,
            expiresAt: null,
            timeRemaining: null,
            hasExpiredCookie: false,
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Activation failed' }),
        })

      const { result } = renderHook(() => useApiKey(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.activateSharedKey()
        })
      ).rejects.toThrow('Activation failed')
    })

    it('should revoke shared key', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            active: false,
            expiresAt: null,
            timeRemaining: null,
            hasExpiredCookie: false,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })

      const { result } = renderHook(() => useApiKey(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.revokeSharedKey()
      })

      expect(result.current.sharedKeyActive).toBe(false)
      expect(result.current.sharedKeyExpiresAt).toBeNull()
      expect(global.fetch).toHaveBeenCalledWith('/api/shared-key/revoke', {
        method: 'POST',
        credentials: 'include',
      })
    })

    it('should check shared key status', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            active: false,
            expiresAt: null,
            timeRemaining: null,
            hasExpiredCookie: false,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            active: true,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
            timeRemaining: 24 * 60 * 60 * 1000,
            hasExpiredCookie: false,
          }),
        })

      const { result } = renderHook(() => useApiKey(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.checkSharedKeyStatus()
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/shared-key/status', {
        method: 'GET',
        credentials: 'include',
      })
    })
  })

  describe('getEffectiveApiKey', () => {
    it('should return user API key when available', async () => {
      localStorageMock.setItem('google_maps_api_key', 'user-key-123')
      
      const { result } = renderHook(() => useApiKey(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const effectiveKey = await result.current.getEffectiveApiKey()
      expect(effectiveKey).toBe('user-key-123')
    })

    it('should return shared key when user key is not available', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            active: true,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
            timeRemaining: 24 * 60 * 60 * 1000,
            hasExpiredCookie: false,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ apiKey: 'shared-key-123' }),
        })

      const { result } = renderHook(() => useApiKey(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await waitFor(() => {
        expect(result.current.sharedKeyActive).toBe(true)
      })

      const effectiveKey = await result.current.getEffectiveApiKey()
      expect(effectiveKey).toBe('shared-key-123')
    })

    it('should return null when no API key is available', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          active: false,
          expiresAt: null,
          timeRemaining: null,
          hasExpiredCookie: false,
        }),
      })

      const { result } = renderHook(() => useApiKey(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const effectiveKey = await result.current.getEffectiveApiKey()
      expect(effectiveKey).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useApiKey(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should not throw, just log error
      expect(result.current.sharedKeyActive).toBe(false)
    })

    it('should throw error when useApiKey is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        renderHook(() => useApiKey())
      }).toThrow('useApiKey must be used within ApiKeyProvider')
      
      consoleSpy.mockRestore()
    })
  })
})

