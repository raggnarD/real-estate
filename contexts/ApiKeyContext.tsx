'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

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
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined)

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sharedKeyActive, setSharedKeyActive] = useState<boolean>(false)
  const [sharedKeyExpiresAt, setSharedKeyExpiresAt] = useState<number | null>(null)
  const [sharedKeyTimeRemaining, setSharedKeyTimeRemaining] = useState<number | null>(null)
  const [hasExpiredCookie, setHasExpiredCookie] = useState<boolean>(false)

  const checkSharedKeyStatusInternal = async () => {
    try {
      const response = await fetch('/api/shared-key/status', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        const wasActive = sharedKeyActive
        
        setSharedKeyActive(data.active)
        setSharedKeyExpiresAt(data.expiresAt)
        setSharedKeyTimeRemaining(data.timeRemaining)
        setHasExpiredCookie(data.hasExpiredCookie || false)
        
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
  }, [])

  // Poll shared key status every minute to check expiration
  useEffect(() => {
    // Only poll if no user API key is set, as shared key is only relevant then
    if (!apiKey) {
      const interval = setInterval(() => {
        checkSharedKeyStatusInternal()
      }, 60000) // Check every 60 seconds

      return () => clearInterval(interval)
    }
  }, [apiKey])

  const activateSharedKey = async () => {
    try {
      const response = await fetch('/api/shared-key/activate', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSharedKeyActive(true)
        setSharedKeyExpiresAt(data.expiresAt)
        setSharedKeyTimeRemaining(24 * 60 * 60 * 1000) // 24 hours
        // Refresh status to get accurate time remaining
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
      const response = await fetch('/api/shared-key/revoke', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        setSharedKeyActive(false)
        setSharedKeyExpiresAt(null)
        setSharedKeyTimeRemaining(null)
        setHasExpiredCookie(false)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to revoke shared key')
      }
    } catch (error) {
      console.error('Error revoking shared key:', error)
      throw error
    }
  }

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
      checkSharedKeyStatus
    }}>
      {children}
    </ApiKeyContext.Provider>
  )
}

export function useApiKey() {
  const context = useContext(ApiKeyContext)
  if (context === undefined) {
    throw new Error('useApiKey must be used within ApiKeyProvider')
  }
  return context
}

