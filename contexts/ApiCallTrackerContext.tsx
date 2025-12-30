'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useApiCallTracker } from '@/hooks/useApiCallTracker'

const ApiCallTrackerContext = createContext<ReturnType<typeof useApiCallTracker> | undefined>(undefined)

export function ApiCallTrackerProvider({ children }: { children: ReactNode }) {
  const tracker = useApiCallTracker()

  return (
    <ApiCallTrackerContext.Provider value={tracker}>
      {children}
    </ApiCallTrackerContext.Provider>
  )
}

export function useApiCallTrackerContext() {
  const context = useContext(ApiCallTrackerContext)
  if (context === undefined) {
    throw new Error('useApiCallTrackerContext must be used within ApiCallTrackerProvider')
  }
  return context
}

