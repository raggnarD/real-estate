'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useApiKey } from '@/contexts/ApiKeyContext'

export default function ApiKeyBanner() {
  const { apiKey, isLoading, sharedKeyActive, sharedKeyTimeRemaining } = useApiKey()
  const [countdown, setCountdown] = useState<number | null>(null)

  // Live countdown timer for shared key
  useEffect(() => {
    if (sharedKeyTimeRemaining !== null && sharedKeyTimeRemaining > 0) {
      setCountdown(sharedKeyTimeRemaining)
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1000) {
            return null
          }
          return prev - 1000
        })
      }, 1000)

      return () => clearInterval(interval)
    } else {
      setCountdown(null)
    }
  }, [sharedKeyTimeRemaining])

  // Don't show banner if loading, user has their own API key, or shared key is active
  if (isLoading || apiKey) {
    return null
  }

  // Show different banner when shared key is active
  if (sharedKeyActive) {
    const formatTime = (ms: number | null) => {
      if (!ms || ms <= 0) return 'Expired'
      const hours = Math.floor(ms / (1000 * 60 * 60))
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
      return `${hours}h ${minutes}m`
    }

    return (
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 1001,
        backgroundColor: '#d4edda',
        borderBottom: '2px solid #28a745',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          flex: 1,
          minWidth: '250px'
        }}>
          <span style={{ fontSize: '1.25rem' }}>🔑</span>
          <div>
            <div style={{ 
              fontWeight: '600', 
              fontSize: '0.9375rem', 
              color: '#155724',
              marginBottom: '0.25rem'
            }}>
              Using 24-Hour Shared API Key
            </div>
            <div style={{ 
              fontSize: '0.875rem', 
              color: '#155724',
              lineHeight: '1.4'
            }}>
              {countdown !== null ? (
                <>Time remaining: <strong>{formatTime(countdown)}</strong></>
              ) : sharedKeyTimeRemaining ? (
                <>Time remaining: <strong>{formatTime(sharedKeyTimeRemaining)}</strong></>
              ) : (
                'Shared API key is active'
              )}
            </div>
          </div>
        </div>
        <Link
          href="/account"
          style={{
            padding: '0.5rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            backgroundColor: '#28a745',
            color: '#fff',
            border: '1px solid #28a745',
            borderRadius: '4px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            cursor: 'pointer',
            display: 'inline-block'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#218838'
            e.currentTarget.style.borderColor = '#218838'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#28a745'
            e.currentTarget.style.borderColor = '#28a745'
          }}
        >
          Manage Key →
        </Link>
      </div>
    )
  }

  // Show warning banner when no API key and no shared key
  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 1001,
      backgroundColor: '#fff3cd',
      borderBottom: '2px solid #ffc107',
      padding: '1rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'wrap'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem',
        flex: 1,
        minWidth: '250px'
      }}>
        <span style={{ fontSize: '1.25rem' }}>⚠️</span>
        <div>
          <div style={{ 
            fontWeight: '600', 
            fontSize: '0.9375rem', 
            color: '#856404',
            marginBottom: '0.25rem'
          }}>
            No API Key Set
          </div>
          <div style={{ 
            fontSize: '0.875rem', 
            color: '#856404',
            lineHeight: '1.4'
          }}>
            Enter your Google Maps API key to enable full functionality.
          </div>
        </div>
      </div>
      <Link
        href="/account"
        style={{
          padding: '0.5rem 1.25rem',
          fontSize: '0.875rem',
          fontWeight: '600',
          backgroundColor: '#ffc107',
          color: '#856404',
          border: '1px solid #ffc107',
          borderRadius: '4px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s',
          cursor: 'pointer',
          display: 'inline-block'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#ffb300'
          e.currentTarget.style.borderColor = '#ffb300'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ffc107'
          e.currentTarget.style.borderColor = '#ffc107'
        }}
      >
        Enter API Key →
      </Link>
    </div>
  )
}

