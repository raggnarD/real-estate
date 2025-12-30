'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { safeTrackedFetch } from '@/utils/safeTrackedFetch'

// Create a separate context for tracker injection
const ApiCallTrackerInjectContext = createContext<{
  trackCall: (url: string, method: string) => string
  updateCall: (id: string, status: 'success' | 'error', duration?: number, error?: string) => void
} | null>(null)

export function useApiCallTrackerInject() {
  return useContext(ApiCallTrackerInjectContext)
}

// Helper to safely get tracker context
function getTrackerContextSafe() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useApiCallTrackerContext } = require('./ApiCallTrackerContext')
    return useApiCallTrackerContext()
  } catch {
    return null
  }
}

interface ApiKeyContextType {
  apiKey: string | null
  setApiKey: (key: string | null) => void
  isLoading: boolean
  sharedKeyActive: boolean
  sharedKeyExpiresAt: number | null
  sharedKeyTimeRemaining: number | null
  hasExpiredCookie: boolean
  activateSharedKey: () => Promise<void>
  revokeSharedKey: () => Promise<void>
  checkSharedKeyStatus: () => Promise<void>
  getEffectiveApiKey: () => Promise<string | null>
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined)

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sharedKeyActive, setSharedKeyActive] = useState<boolean>(false)
  const [sharedKeyExpiresAt, setSharedKeyExpiresAt] = useState<number | null>(null)
  const [sharedKeyTimeRemaining, setSharedKeyTimeRemaining] = useState<number | null>(null)
  const [hasExpiredCookie, setHasExpiredCookie] = useState<boolean>(false)
  const [sharedKeyValue, setSharedKeyValue] = useState<string | null>(null)
  
  // Get tracker from inject context
  const tracker = useApiCallTrackerInject()

  const fetchSharedKey = useCallback(async () => {
    try {
      const response = await safeTrackedFetch('/api/shared-key/get', {
        method: 'GET',
        credentials: 'include',
        tracker: tracker
      })
      
      if (response.ok) {
        const data = await response.json()
        setSharedKeyValue(data.apiKey)
        return data.apiKey
      } else {
        setSharedKeyValue(null)
        return null
      }
    } catch (error) {
      console.error('Error fetching shared key:', error)
      setSharedKeyValue(null)
      return null
    }
  }, [tracker])

  const checkSharedKeyStatusInternal = async () => {
    try {
      const response = await safeTrackedFetch('/api/shared-key/status', {
        method: 'GET',
        credentials: 'include',
        tracker: tracker
      })
      
      if (response.ok) {
        const data = await response.json()
        const wasActive = sharedKeyActive
        
        setSharedKeyActive(data.active)
        setSharedKeyExpiresAt(data.expiresAt)
        setSharedKeyTimeRemaining(data.timeRemaining)
        setHasExpiredCookie(data.hasExpiredCookie || false)
        
        // If active, fetch the actual key value
        if (data.active) {
          await fetchSharedKey()
        } else {
          setSharedKeyValue(null)
        }
        
        // If expired, automatically disable and show notification
        if (!data.active && wasActive) {
          // Key just expired - show warning
          console.warn('Shared API key has expired')
        }
      }
    } catch (error) {
      console.error('Error checking shared key status:', error)
    }
  }

  const checkSharedKeyStatus = async () => {
    await checkSharedKeyStatusInternal()
  }

  useEffect(() => {
    // Load API key from localStorage only (not from environment variable)
    // Environment variable is only used server-side for shared key feature
    const stored = localStorage.getItem('google_maps_api_key')
    
    let loadedKey: string | null = null
    if (stored) {
      loadedKey = stored
      setApiKeyState(stored)
    }
    
    setIsLoading(false)
    
    // Check shared key status on mount
    checkSharedKeyStatusInternal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Poll shared key status every 2 minutes to check expiration (reduced frequency to avoid rate limits)
  useEffect(() => {
    // Only poll if no user API key is set, as shared key is only relevant then
    if (!apiKey) {
      const interval = setInterval(() => {
        checkSharedKeyStatusInternal()
      }, 120000) // Check every 2 minutes (120 seconds) to avoid rate limits

      return () => clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey])

  const activateSharedKey = async () => {
    try {
      const response = await safeTrackedFetch('/api/shared-key/activate', {
        method: 'POST',
        credentials: 'include',
        tracker: tracker
      })
      
      if (response.ok) {
        const data = await response.json()
        setSharedKeyActive(true)
        setSharedKeyExpiresAt(data.expiresAt)
        setSharedKeyTimeRemaining(24 * 60 * 60 * 1000) // 24 hours
        // Fetch the actual key value and refresh status
        await fetchSharedKey()
        await checkSharedKeyStatusInternal()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to activate shared key')
      }
    } catch (error) {
      console.error('Error activating shared key:', error)
      throw error
    }
  }

  const revokeSharedKey = async () => {
    try {
      const response = await safeTrackedFetch('/api/shared-key/revoke', {
        method: 'POST',
        credentials: 'include',
        tracker: tracker
      })
      
      if (response.ok) {
        setSharedKeyActive(false)
        setSharedKeyExpiresAt(null)
        setSharedKeyTimeRemaining(null)
        setHasExpiredCookie(false)
        setSharedKeyValue(null)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to revoke shared key')
      }
    } catch (error) {
      console.error('Error revoking shared key:', error)
      throw error
    }
  }

  const getEffectiveApiKey = useCallback(async (): Promise<string | null> => {
    // Priority 1: User's own API key
    if (apiKey) {
      return apiKey
    }
    
    // Priority 2: Shared key (if active and we have the value)
    if (sharedKeyActive && sharedKeyValue) {
      return sharedKeyValue
    }
    
    // If shared key is active but we don't have the value, fetch it
    if (sharedKeyActive && !sharedKeyValue) {
      const fetchedKey = await fetchSharedKey()
      return fetchedKey
    }
    
    // No API key available
    return null
  }, [apiKey, sharedKeyActive, sharedKeyValue, fetchSharedKey])

  const setApiKey = (key: string | null) => {
    if (key) {
      localStorage.setItem('google_maps_api_key', key)
      setApiKeyState(key)
    } else {
      localStorage.removeItem('google_maps_api_key')
      setApiKeyState(null)
    }
  }

  return (
    <ApiKeyContext.Provider value={{ 
      apiKey, 
      setApiKey, 
      isLoading, 
      sharedKeyActive,
      sharedKeyExpiresAt,
      sharedKeyTimeRemaining,
      hasExpiredCookie,
      activateSharedKey,
      revokeSharedKey,
      checkSharedKeyStatus,
      getEffectiveApiKey
    }}>
      {children}
    </ApiKeyContext.Provider>
  )
}

/**
 * Wrapper that injects tracker into ApiKeyProvider
 * This component must be used inside ApiCallTrackerProvider
 */
export function ApiKeyProviderWithTracker({ children }: { children: ReactNode }) {
  const trackerContext = getTrackerContextSafe()
  
  const tracker = trackerContext ? {
    trackCall: trackerContext.trackCall,
    updateCall: trackerContext.updateCall
  } : null

  return (
    <ApiCallTrackerInjectContext.Provider value={tracker}>
      <ApiKeyProvider>{children}</ApiKeyProvider>
    </ApiCallTrackerInjectContext.Provider>
  )
}

export function useApiKey() {
  const context = useContext(ApiKeyContext)
  if (context === undefined) {
    throw new Error('useApiKey must be used within ApiKeyProvider')
  }
  return context
}

