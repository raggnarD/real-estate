'use client'

import { ReactNode } from 'react'
import { ApiKeyProvider } from '@/contexts/ApiKeyContext'
import { useApiCallTrackerContext } from '@/contexts/ApiCallTrackerContext'

/**
 * Wrapper component that injects the API call tracker into ApiKeyProvider
 */
export function ApiKeyProviderWithTracker({ children }: { children: ReactNode }) {
  const tracker = useApiCallTrackerContext()
  
  // Inject tracker into ApiKeyProvider via a custom hook or prop
  // For now, we'll modify ApiKeyProvider to accept tracker via context
  return <ApiKeyProvider>{children}</ApiKeyProvider>
}

