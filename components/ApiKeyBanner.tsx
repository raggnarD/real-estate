'use client'

import Link from 'next/link'
import { useApiKey } from '@/contexts/ApiKeyContext'

export default function ApiKeyBanner() {
  const { apiKey, isDemoMode } = useApiKey()

  // Only show banner when no API key is set
  if (apiKey) {
    return null
  }

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
            No API Key Set - Demo Mode Active
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

