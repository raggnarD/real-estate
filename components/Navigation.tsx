'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ApiKeyDebug from '@/components/ApiKeyDebug'
import { useApiKey } from '@/contexts/ApiKeyContext'

export default function Navigation() {
  const pathname = usePathname()
  const { forceDemoMode, setForceDemoMode, isDemoMode } = useApiKey()

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
        
        {/* Demo Mode Toggle */}
        <div style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.5rem 1rem',
          backgroundColor: isDemoMode ? '#fff3cd' : '#e6f2ff',
          borderRadius: '4px',
          border: `1px solid ${isDemoMode ? '#ffc107' : '#0070f3'}`
        }}>
          <span style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: isDemoMode ? '#856404' : '#004085'
          }}>
            🎭 Demo Mode
          </span>
          <label style={{
            position: 'relative',
            display: 'inline-block',
            width: '44px',
            height: '24px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={forceDemoMode}
              onChange={(e) => setForceDemoMode(e.target.checked)}
              style={{
                opacity: 0,
                width: 0,
                height: 0
              }}
            />
            <span style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: forceDemoMode ? '#ffc107' : '#ccc',
              borderRadius: '24px',
              transition: 'background-color 0.3s',
              cursor: 'pointer'
            }}>
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
        </div>
      </div>
      <ApiKeyDebug />
    </nav>
  )
}

