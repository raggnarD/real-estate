'use client'

import { useState, useEffect, useCallback } from 'react'

export interface ApiCall {
  id: string
  url: string
  method: string
  status: 'pending' | 'success' | 'error'
  timestamp: number
  duration?: number
  error?: string
}

export function useApiCallTracker() {
  const [calls, setCalls] = useState<ApiCall[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeCalls, setActiveCalls] = useState(0)

  // Track a new API call
  const trackCall = useCallback((url: string, method: string = 'GET') => {
    const id = `${Date.now()}-${Math.random()}`
    const call: ApiCall = {
      id,
      url,
      method,
      status: 'pending',
      timestamp: Date.now()
    }

    setCalls(prev => [call, ...prev].slice(0, 50)) // Keep last 50 calls
    setActiveCalls(prev => prev + 1)

    return id
  }, [])

  // Update call status
  const updateCall = useCallback((id: string, status: 'success' | 'error', duration?: number, error?: string) => {
    setCalls(prev => prev.map(call => 
      call.id === id 
        ? { ...call, status, duration, error }
        : call
    ))
    setActiveCalls(prev => Math.max(0, prev - 1))
  }, [])

  // Clear old calls (older than 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      setCalls(prev => prev.filter(call => call.timestamp > fiveMinutesAgo))
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  // Auto-open if there are errors
  useEffect(() => {
    const hasErrors = calls.some(call => call.status === 'error')
    if (hasErrors && !isOpen) {
      setIsOpen(true)
    }
  }, [calls, isOpen])

  return {
    calls,
    isOpen,
    setIsOpen,
    activeCalls,
    trackCall,
    updateCall,
    hasActiveCalls: activeCalls > 0,
    errorCount: calls.filter(c => c.status === 'error').length,
    successCount: calls.filter(c => c.status === 'success').length
  }
}

