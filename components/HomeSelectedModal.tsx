'use client'

import { useState, useEffect } from 'react'

interface HomeSelectedModalProps {
  isOpen: boolean
  onClose: () => void
  onContinue: () => void
  zillowUrl: string
}

export default function HomeSelectedModal({ isOpen, onClose, onContinue, zillowUrl }: HomeSelectedModalProps) {
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isOpen) return null

  const handleCancel = () => {
    onClose()
  }

  const handleContinue = () => {
    // Open Zillow in a new tab
    if (zillowUrl) {
      window.open(zillowUrl, '_blank', 'noopener,noreferrer')
    }
    onClose()
    // Call onContinue after a short delay to allow modal to close
    setTimeout(() => {
      onContinue()
    }, 100)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: isMobile ? 'flex-start' : 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: isMobile ? '0' : '0.5rem',
      overflow: 'auto'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: isMobile ? '0' : '12px',
        maxWidth: isMobile ? '100%' : '500px',
        width: '100%',
        height: isMobile ? '100dvh' : 'auto',
        maxHeight: isMobile ? '100dvh' : '90vh',
        overflow: 'hidden',
        boxShadow: isMobile ? 'none' : '0 8px 32px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        margin: isMobile ? '0' : '0 auto',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1rem 1.5rem' : '1.5rem',
          borderBottom: '1px solid #e0e0e0',
          background: 'linear-gradient(135deg, #0070f3 0%, #0051cc 100%)',
          borderRadius: isMobile ? '0' : '12px 12px 0 0',
          color: '#fff',
          flexShrink: 0
        }}>
          <h2 style={{
            margin: 0,
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff'
          }}>
            🏠 Opening Zillow
          </h2>
        </div>

        {/* Content */}
        <div style={{
          padding: isMobile ? '1rem 1.5rem 5rem 1.5rem' : '2rem',
          fontSize: '1rem',
          lineHeight: '1.7',
          color: '#333',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch'
        }}>
          <p style={{
            margin: 0,
            fontSize: isMobile ? '0.9375rem' : '1rem',
            color: '#666',
            lineHeight: '1.6',
            marginBottom: '1rem'
          }}>
            A Zillow page will open in a new tab. Please browse Zillow to find a home you're interested in, then come back to this page once you've found one.
          </p>
          <p style={{
            margin: 0,
            fontSize: isMobile ? '0.9375rem' : '1rem',
            color: '#666',
            lineHeight: '1.6'
          }}>
            Once you've found a home on Zillow, we can help you calculate the true commute time to your work address.
          </p>
        </div>

        {/* Footer */}
        <div style={{
          padding: isMobile ? '1rem 1.5rem' : '1rem 1.5rem',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          backgroundColor: '#f9f9f9',
          borderRadius: isMobile ? '0' : '0 0 12px 12px',
          flexShrink: 0,
          zIndex: 10,
          ...(isMobile ? {
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)'
          } : {})
        }}>
          <button
            onClick={handleCancel}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#5a6268'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#6c757d'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: '#0070f3',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'background-color 0.2s',
              boxShadow: '0 2px 4px rgba(0, 112, 243, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0056b3'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0070f3'
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

