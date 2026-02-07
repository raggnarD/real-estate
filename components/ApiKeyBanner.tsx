'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signIn } from 'next-auth/react'
import { useApiKey } from '@/contexts/ApiKeyContext'

export default function ApiKeyBanner() {
  const { status } = useSession()
  const { apiKey, isLoading } = useApiKey()
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Don't show banner if:
  // 1. Data is loading
  // 2. User has their own personal API key
  // 3. User is authenticated (they automatically get the guest key)
  if (isLoading || apiKey || status === 'authenticated') {
    return null
  }

  // Show warning banner when unauthenticated and no personal API key
  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 1001,
      backgroundColor: '#fff3cd',
      borderBottom: '2px solid #ffc107',
      padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'wrap',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flex: 1,
        minWidth: '250px'
      }}>
        <span style={{ fontSize: '1.25rem' }}>🔐</span>
        <div>
          <div style={{
            fontWeight: '600',
            fontSize: '0.9375rem',
            color: '#856404',
            marginBottom: '0.25rem'
          }}>
            Restricted Access
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#856404',
            lineHeight: '1.4'
          }}>
            Sign in with Google to enable guest API access for commute calculations.
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => signIn('google')}
          style={{
            padding: '0.5rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            backgroundColor: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
          }}
        >
          Sign In
        </button>
        <Link
          href="/account"
          style={{
            padding: '0.5rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            backgroundColor: 'transparent',
            color: '#856404',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            cursor: 'pointer',
            display: 'inline-block'
          }}
        >
          Add Key →
        </Link>
      </div>
    </div>
  )
}

