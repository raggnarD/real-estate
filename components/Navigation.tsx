'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import ApiKeyDebug from '@/components/ApiKeyDebug'
import { useApiKey } from '@/contexts/ApiKeyContext'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { apiKey, forceDemoMode, setForceDemoMode, isDemoMode } = useApiKey()

  const handleToggleChange = (checked: boolean) => {
    if (!checked && !apiKey) {
      // User trying to turn off demo mode but no API key - redirect to account page
      router.push('/account')
    } else {
      setForceDemoMode(checked)
    }
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
          🧭 Neighborhood Finder
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
          
          {/* Demo Mode Toggle */}
          <div 
            role="group"
            aria-label="Demo mode toggle"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 1rem',
              backgroundColor: !apiKey 
                ? '#e9ecef' 
                : (isDemoMode ? '#fff3cd' : '#e6f2ff'),
              borderRadius: '4px',
              border: `1px solid ${!apiKey 
                ? '#adb5bd' 
                : (isDemoMode ? '#ffc107' : '#0070f3')}`
            }}>
            <span 
              style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: !apiKey 
                  ? '#6c757d' 
                  : (isDemoMode ? '#856404' : '#004085')
              }}
            >
              🎭 Demo Mode
            </span>
            {!apiKey ? (
              <div
                role="img"
                aria-label="Locked - API key required to unlock demo mode toggle"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  color: '#6c757d'
                }}
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ color: 'currentColor' }}
                  aria-hidden="true"
                >
                  <path 
                    d="M18 11H17V9C17 6.24 14.76 4 12 4C9.24 4 7 6.24 7 9V11H6C5.45 11 5 11.45 5 12V20C5 20.55 5.45 21 6 21H18C18.55 21 19 20.55 19 20V12C19 11.45 18.55 11 18 11ZM9 9C9 7.34 10.34 6 12 6C13.66 6 15 7.34 15 9V11H9V9ZM17 19H7V13H17V19Z" 
                    fill="currentColor"
                  />
                </svg>
              </div>
            ) : (
              <label 
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '44px',
                  height: '24px',
                  cursor: 'pointer'
                }}
                aria-label={`Demo mode is ${forceDemoMode ? 'on' : 'off'}. Click to toggle.`}
              >
                <input
                  type="checkbox"
                  checked={forceDemoMode}
                  onChange={(e) => handleToggleChange(e.target.checked)}
                  aria-label={`Toggle demo mode. Currently ${forceDemoMode ? 'on' : 'off'}.`}
                  style={{
                    opacity: 0,
                    width: 0,
                    height: 0,
                    position: 'absolute'
                  }}
                />
                <span 
                  role="switch"
                  aria-checked={forceDemoMode}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: forceDemoMode ? '#ffc107' : '#6c757d',
                    borderRadius: '24px',
                    transition: 'background-color 0.3s',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '18px',
                    width: '18px',
                    left: '3px',
                    bottom: '3px',
                    backgroundColor: '#fff',
                    borderRadius: '50%',
                    transition: 'transform 0.3s',
                    transform: forceDemoMode ? 'translateX(20px)' : 'translateX(0)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </span>
              </label>
            )}
          </div>
        </div>
      </div>
      <ApiKeyDebug />
    </nav>
  )
}

