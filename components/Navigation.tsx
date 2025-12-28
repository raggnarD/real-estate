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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
      padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
      marginBottom: isMobile ? '1rem' : '2rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        gap: isMobile ? '1rem' : '2rem',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        flexWrap: isMobile ? 'wrap' : 'nowrap'
      }}>
        {/* Mobile menu button and logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: isMobile ? '100%' : 'auto',
          marginRight: isMobile ? 0 : '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center'
          }}>
            <img
              src="/rushroost-logo.png"
              alt="RushRoost"
              width={409}
              height={610}
              style={{
                height: isMobile ? '40px' : '60px',
                width: 'auto',
                objectFit: 'contain',
                cursor: 'default'
              }}
              onError={(e) => {
                console.error('Logo image failed to load')
              }}
            />
          </div>
          {isMobile && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
        
        {/* Desktop Navigation */}
        {!isMobile && (
          <>
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
            
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
          </>
        )}

        {/* Mobile menu */}
        {isMobile && isMobileMenuOpen && (
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid #eee'
          }}>
            <Link 
              href="/neighborhood-finder"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                textDecoration: 'none',
                color: pathname === '/neighborhood-finder' ? '#0070f3' : '#333',
                fontWeight: pathname === '/neighborhood-finder' ? '600' : '400',
                fontSize: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '4px',
                transition: 'all 0.2s',
                backgroundColor: pathname === '/neighborhood-finder' ? '#e6f2ff' : 'transparent'
              }}
            >
              📍 Neighborhood Finder
            </Link>
            <Link 
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                textDecoration: 'none',
                color: pathname === '/' ? '#0070f3' : '#333',
                fontWeight: pathname === '/' ? '600' : '400',
                fontSize: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '4px',
                transition: 'all 0.2s',
                backgroundColor: pathname === '/' ? '#e6f2ff' : 'transparent'
              }}
            >
              ⏱️ True Commute Time
            </Link>
            <Link
              href="/account"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                textDecoration: 'none',
                color: pathname === '/account' ? '#0070f3' : '#333',
                fontWeight: pathname === '/account' ? '600' : '400',
                fontSize: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '4px',
                transition: 'all 0.2s',
                backgroundColor: pathname === '/account' ? '#e6f2ff' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
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
              Account Settings
            </Link>
          </div>
        )}
      </div>
      <ApiKeyDebug />
    </nav>
  )
}

