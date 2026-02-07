'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWizard } from '@/contexts/WizardContext'
import NeighborhoodFinderIntro from '@/components/NeighborhoodFinderIntro'

export default function IntroModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [showNextModal, setShowNextModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const { setWizardActive, setWizardStep } = useWizard()

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // Check if user has seen the intro before
    const hasSeenIntro = localStorage.getItem('hasSeenIntro')
    if (!hasSeenIntro) {
      setIsOpen(true)
    }
  }, [])

  const handleGetStarted = () => {
    setIsOpen(false)
    localStorage.setItem('hasSeenIntro', 'true')
    // Activate wizard mode
    setWizardActive(true)
    // Immediately show the next modal
    setShowNextModal(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem('hasSeenIntro', 'true')
  }

  const handleNextModalClose = () => {
    setShowNextModal(false)
    // If wizard is active and we're closing after API key setup, navigate
    // This will be handled by NeighborhoodFinderIntro, but we ensure modal closes
  }

  return (
    <>
      {isOpen && (
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
        }} onClick={handleClose}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: isMobile ? '0' : '12px',
            maxWidth: isMobile ? '100%' : '600px',
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
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #e0e0e0',
              background: 'linear-gradient(135deg, #0070f3 0%, #0051cc 100%)',
              borderRadius: isMobile ? '0' : '12px 12px 0 0',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <img
                src="/rushroost-logo.png"
                alt="RushRoost"
                width={409}
                height={610}
                style={{
                  height: '60px',
                  width: 'auto',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  console.error('Logo image failed to load')
                }}
              />
            </div>

            {/* Content */}
            <div style={{
              padding: isMobile ? '1rem 1.5rem 5rem 1.5rem' : '1.5rem',
              fontSize: '1rem',
              lineHeight: '1.7',
              color: '#333',
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch'
            }}>
              <h2 style={{
                marginTop: 0,
                marginBottom: '0.5rem',
                fontSize: '1.75rem',
                fontWeight: '700',
                color: '#000'
              }}>
                Welcome to RushRoost
              </h2>
              <p style={{
                margin: 0,
                marginBottom: '1.5rem',
                fontSize: '1rem',
                color: '#666',
                lineHeight: '1.5'
              }}>
                Your intelligent commute time calculator
              </p>
              <p style={{ marginTop: 0, marginBottom: '2rem', fontSize: '1.125rem' }}>
                RushRoost was built to solve a common problem: <strong>finding accurate commute times</strong> when searching for a new home or evaluating neighborhoods.
              </p>
            </div>

            {/* Footer */}
            <div style={{
              padding: isMobile ? '1rem 1.5rem' : '1rem 1.5rem',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
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
                onClick={handleClose}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  backgroundColor: 'transparent',
                  color: '#666',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                  textDecoration: 'underline'
                }}
              >
                Skip for now
              </button>
              <button
                onClick={handleGetStarted}
                style={{
                  padding: '0.75rem 2rem',
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
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
      {showNextModal && (
        <NeighborhoodFinderIntro
          isOpen={showNextModal}
          onClose={handleNextModalClose}
        />
      )}
    </>
  )
}

