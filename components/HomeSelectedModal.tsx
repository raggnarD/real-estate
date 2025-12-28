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

  const handleNo = () => {
    onClose()
  }

  const handleYes = () => {
    onClose()
    onContinue()
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
        maxHeight: isMobile ? '100vh' : '90vh',
        overflow: 'auto',
        boxShadow: isMobile ? 'none' : '0 8px 32px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e0e0e0',
          background: 'linear-gradient(135deg, #0070f3 0%, #0051cc 100%)',
          borderRadius: isMobile ? '0' : '12px 12px 0 0',
          color: '#fff'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff'
          }}>
            🏠 Have you selected a home?
          </h2>
        </div>

        {/* Content */}
        <div style={{
          padding: isMobile ? '1.5rem' : '2rem',
          fontSize: '1rem',
          lineHeight: '1.7',
          color: '#333',
          flex: 1
        }}>
          <p style={{
            margin: 0,
            fontSize: isMobile ? '0.9375rem' : '1rem',
            color: '#666',
            lineHeight: '1.6'
          }}>
            If you've found a home you're interested in on Zillow, we can help you calculate the true commute time to your work address.
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
          borderRadius: isMobile ? '0' : '0 0 12px 12px'
        }}>
          <button
            onClick={handleNo}
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
            No, not yet
          </button>
          <button
            onClick={handleYes}
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
            Yes, Continue
          </button>
        </div>
      </div>
    </div>
  )
}

