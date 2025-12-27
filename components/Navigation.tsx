'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import ApiKeyDebug from '@/components/ApiKeyDebug'
import { useApiKey } from '@/contexts/ApiKeyContext'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { 
    apiKey, 
    sharedKeyActive,
    sharedKeyTimeRemaining,
    revokeSharedKey
  } = useApiKey()
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

  const formatTime = (ms: number | null) => {
    if (!ms || ms <= 0) return 'Expired'
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backgroundColor: '#fff',
      borderBottom: '1px solid #ddd',
      padding: '1rem 2rem',
      marginBottom: '2rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        gap: '2rem',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Platform Logo */}
        <Link 
          href="/"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            marginRight: '1rem'
          }}
        >
          <img
            src="/rushroost-logo.png"
            alt="RushRoost"
            style={{
              height: '40px',
              width: 'auto',
              objectFit: 'contain'
            }}
            onError={(e) => {
              // Fallback if image doesn't load
              console.error('Logo image failed to load')
            }}
          />
        </Link>
        
        <Link 
          href="/"
          style={{
            textDecoration: 'none',
            color: pathname === '/' ? '#0070f3' : '#333',
            fontWeight: pathname === '/' ? '600' : '400',
            fontSize: '1rem',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            transition: 'all 0.2s',
            backgroundColor: pathname === '/' ? '#e6f2ff' : 'transparent'
          }}
        >
          ⏱️ True Commute Time
        </Link>
        <Link 
          href="/neighborhood-finder"
          style={{
            textDecoration: 'none',
            color: pathname === '/neighborhood-finder' ? '#0070f3' : '#333',
            fontWeight: pathname === '/neighborhood-finder' ? '600' : '400',
            fontSize: '1rem',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            transition: 'all 0.2s',
            backgroundColor: pathname === '/neighborhood-finder' ? '#e6f2ff' : 'transparent'
          }}
        >
          📍 Neighborhood Finder
        </Link>
        
        {/* Spacer to push right-side items to the right */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Account/Profile Button */}
          <Link
            href="/account"
            style={{
              textDecoration: 'none',
              color: pathname === '/account' ? '#0070f3' : '#333',
              fontWeight: pathname === '/account' ? '600' : '400',
              fontSize: '1rem',
              padding: '0.5rem',
              borderRadius: '4px',
              transition: 'all 0.2s',
              backgroundColor: pathname === '/account' ? '#e6f2ff' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px'
            }}
            title="Account Settings"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: 'currentColor' }}
            >
              <path 
                d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26003 15 3.41003 18.13 3.41003 22" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
      <ApiKeyDebug />
    </nav>
  )
}

