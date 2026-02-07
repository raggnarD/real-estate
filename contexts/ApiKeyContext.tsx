'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

interface ApiKeyContextType {
  apiKey: string | null
  setApiKey: (key: string | null) => void
  isLoading: boolean
  guestKey: string | null
  getEffectiveApiKey: () => Promise<string | null>
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined)

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const { status } = useSession()
  const [apiKey, setApiKeyState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [guestKey, setGuestKey] = useState<string | null>(null)

  const fetchGuestKey = useCallback(async () => {
    try {
      const response = await fetch('/api/shared-key/get')
      if (response.ok) {
        const data = await response.json()
        setGuestKey(data.apiKey)
        return data.apiKey
      }
    } catch (error) {
      console.error('Error fetching guest key:', error)
    }
    return null
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('google_maps_api_key')
    if (stored) {
      setApiKeyState(stored)
    }
    setIsLoading(false)
  }, [])

  // Refetch guest key whenever auth status changes to authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      fetchGuestKey()
    } else {
      setGuestKey(null)
    }
  }, [status, fetchGuestKey])

  const getEffectiveApiKey = useCallback(async (): Promise<string | null> => {
    if (apiKey) return apiKey
    if (guestKey) return guestKey

    // Fallback try fetch if authenticated but guestKey not yet set
    if (status === 'authenticated') {
      return await fetchGuestKey()
    }

    return null
  }, [apiKey, guestKey, status, fetchGuestKey])

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
      guestKey,
      getEffectiveApiKey
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

