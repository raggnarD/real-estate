'use client'

import { useState, useEffect } from 'react'
import { useApiCallTracker, ApiCall } from '@/hooks/useApiCallTracker'

interface ApiCallStatusProps {
  tracker: ReturnType<typeof useApiCallTracker>
}

export default function ApiCallStatus({ tracker }: ApiCallStatusProps) {
  const { calls, isOpen, setIsOpen, activeCalls, hasActiveCalls, errorCount, successCount } = tracker
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const formatDuration = (ms?: number) => {
    if (!ms) return '—'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url, window.location.origin)
      return urlObj.pathname + urlObj.search
    } catch {
      return url
    }
  }

  const getStatusColor = (status: ApiCall['status']) => {
    switch (status) {
      case 'pending': return '#ffa500'
      case 'success': return '#28a745'
      case 'error': return '#dc3545'
      default: return '#6c757d'
    }
  }

  const getStatusIcon = (status: ApiCall['status']) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'success': return '✓'
      case 'error': return '✗'
      default: return '•'
    }
  }

  if (calls.length === 0 && !hasActiveCalls) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: isMobile ? '1rem' : '1.5rem',
        right: isMobile ? '1rem' : '1.5rem',
        zIndex: 9999,
        maxWidth: isMobile ? 'calc(100% - 2rem)' : '400px',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '0.875rem'
      }}
    >
      {/* Header */}
      <div
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            e.stopPropagation()
            setIsOpen(!isOpen)
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Collapse API calls' : 'Expand API calls'}
        style={{
          padding: '0.75rem 1rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: isOpen ? '1px solid #eee' : 'none',
          backgroundColor: hasActiveCalls ? '#fff3cd' : errorCount > 0 ? '#f8d7da' : '#f8f9fa',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          userSelect: 'none',
          transition: 'background-color 0.2s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem' }}>
            {isOpen ? '▼' : '▲'}
          </span>
          <span style={{ fontWeight: '600', color: '#000' }}>
            API Calls
          </span>
          {activeCalls > 0 && (
            <span
              style={{
                backgroundColor: '#ffa500',
                color: '#fff',
                borderRadius: '12px',
                padding: '0.125rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}
            >
              {activeCalls} active
            </span>
          )}
          {errorCount > 0 && (
            <span
              style={{
                backgroundColor: '#dc3545',
                color: '#fff',
                borderRadius: '12px',
                padding: '0.125rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}
            >
              {errorCount} errors
            </span>
          )}
        </div>
        <div style={{ color: '#666', fontSize: '0.75rem' }}>
          {successCount} success
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div
          style={{
            maxHeight: isMobile ? '300px' : '400px',
            overflowY: 'auto',
            padding: '0.5rem'
          }}
        >
          {calls.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
              No API calls recorded
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {calls.map(call => (
                <div
                  key={call.id}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #eee',
                    borderRadius: '4px',
                    backgroundColor: call.status === 'error' ? '#fff5f5' : call.status === 'pending' ? '#fffbf0' : '#f8f9fa'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1rem' }}>{getStatusIcon(call.status)}</span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '3px',
                        backgroundColor: getStatusColor(call.status),
                        color: '#fff'
                      }}
                    >
                      {call.method}
                    </span>
                    <span style={{ color: '#666', fontSize: '0.75rem' }}>
                      {formatDuration(call.duration)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      color: '#333',
                      wordBreak: 'break-all',
                      marginTop: '0.25rem'
                    }}
                    title={call.url}
                  >
                    {formatUrl(call.url)}
                  </div>
                  {call.error && (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#dc3545',
                        marginTop: '0.25rem',
                        padding: '0.25rem',
                        backgroundColor: '#fff',
                        borderRadius: '3px'
                      }}
                    >
                      {call.error}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: '#999',
                      marginTop: '0.25rem'
                    }}
                  >
                    {new Date(call.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

