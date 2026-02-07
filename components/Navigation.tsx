'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import ApiKeyDebug from '@/components/ApiKeyDebug'
import { useApiKey } from '@/contexts/ApiKeyContext'
import LoginButton from '@/components/auth/LoginButton'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const {
    apiKey
  } = useApiKey()
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
              <AccountMenu />
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
            <div style={{ padding: '0.5rem 1rem' }}>
              <AccountMenu mobile onClick={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        )}
      </div>
      <ApiKeyDebug />
    </nav>
  )
}

import { signIn, signOut, useSession } from "next-auth/react"

function AccountMenu({ mobile, onClick }: { mobile?: boolean, onClick?: () => void }) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  if (!session) {
    return (
      <button
        onClick={() => {
          signIn("google")
          onClick?.()
        }}
        style={{
          background: '#0070f3',
          color: '#fff',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        Sign In
      </button>
    )
  }

  if (mobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ padding: '0.5rem 0', fontWeight: '600', color: '#666', fontSize: '0.8rem' }}>
          SIGNED IN AS {session.user?.name?.toUpperCase()}
        </div>
        <Link
          href="/account"
          onClick={onClick}
          style={{
            textDecoration: 'none',
            color: pathname === '/account' ? '#0070f3' : '#333',
            padding: '0.75rem 0',
            fontSize: '1rem'
          }}
        >
          👤 Account Settings
        </Link>
        <button
          onClick={() => signOut()}
          style={{
            background: 'none',
            border: 'none',
            color: '#ff4d4f',
            padding: '0.75rem 0',
            fontSize: '1rem',
            textAlign: 'left',
            cursor: 'pointer'
          }}
        >
          🚪 Sign Out
        </button>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderRadius: '50%'
        }}
        title={session.user?.name || 'Account'}
      >
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || ''}
            style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #0070f3' }}
          />
        ) : (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#0070f3',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            {session.user?.name?.[0] || session.user?.email?.[0] || '?'}
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}
          />
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            width: '200px',
            zIndex: 1001,
            overflow: 'hidden'
          }}>
            <div style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
              <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#000' }}>{session.user?.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.user?.email}</div>
            </div>
            <Link
              href="/account"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'block',
                padding: '10px 12px',
                textDecoration: 'none',
                color: '#333',
                fontSize: '0.9rem',
                backgroundColor: pathname === '/account' ? '#f0f7ff' : 'transparent'
              }}
            >
              Account Settings
            </Link>
            <button
              onClick={() => signOut()}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                background: 'none',
                border: 'none',
                color: '#ff4d4f',
                fontSize: '0.9rem',
                cursor: 'pointer',
                borderTop: '1px solid #eee'
              }}
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  )
}


