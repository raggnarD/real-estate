'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ApiKeyContextType {
  apiKey: string | null
  setApiKey: (key: string | null) => void
  isDemoMode: boolean
  isLoading: boolean
  forceDemoMode: boolean
  setForceDemoMode: (force: boolean) => void
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined)

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null)
  const [forceDemoMode, setForceDemoModeState] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load API key from localStorage
    const stored = localStorage.getItem('google_maps_api_key')
    const envKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    // Priority: stored key > env key > null (demo mode)
    let loadedKey: string | null = null
    if (stored) {
      loadedKey = stored
      setApiKeyState(stored)
    } else if (envKey) {
      loadedKey = envKey
      setApiKeyState(envKey)
    }
    
    // Load force demo mode preference
    const storedForceDemo = localStorage.getItem('force_demo_mode')
    
    // If no API key is available, automatically enable demo mode
    if (!loadedKey) {
      setForceDemoModeState(true)
      localStorage.setItem('force_demo_mode', 'true')
    } else if (storedForceDemo === 'true') {
      setForceDemoModeState(true)
    }
    
    setIsLoading(false)
  }, [])

  const setApiKey = (key: string | null) => {
    if (key) {
      localStorage.setItem('google_maps_api_key', key)
      setApiKeyState(key)
    } else {
      localStorage.removeItem('google_maps_api_key')
      setApiKeyState(null)
      // Automatically enable demo mode when API key is cleared
      setForceDemoModeState(true)
      localStorage.setItem('force_demo_mode', 'true')
    }
  }

  const setForceDemoMode = (force: boolean) => {
    if (force) {
      localStorage.setItem('force_demo_mode', 'true')
    } else {
      localStorage.removeItem('force_demo_mode')
    }
    setForceDemoModeState(force)
  }

  // Demo mode is active if forced OR if no API key is available
  const isDemoMode = forceDemoMode || !apiKey

  return (
    <ApiKeyContext.Provider value={{ 
      apiKey, 
      setApiKey, 
      isDemoMode, 
      isLoading, 
      forceDemoMode, 
      setForceDemoMode 
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

