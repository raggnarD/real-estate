'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { useWizard } from '@/contexts/WizardContext'

interface NeighborhoodFinderIntroProps {
  isOpen: boolean
  onClose: () => void
}

export default function NeighborhoodFinderIntro({ isOpen, onClose }: NeighborhoodFinderIntroProps) {
  const { data: session, status } = useSession()
  const [hasSeenIntro, setHasSeenIntro] = useState(false)
  const [showAuthStep, setShowAuthStep] = useState(false)
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

  const router = useRouter()
  const { wizardActive, setWizardStep } = useWizard()

  useEffect(() => {
    // Don't auto-close if in wizard mode - let the flow control it
    if (!wizardActive) {
      const seen = localStorage.getItem('hasSeenNeighborhoodFinderIntro')
      if (seen === 'true') {
        setHasSeenIntro(true)
        onClose() // Auto-close if already seen and not in wizard
      }
    }
    // If in wizard mode and modal is open, ensure it stays open
    if (wizardActive && isOpen && !hasSeenIntro) {
      setHasSeenIntro(false) // Reset to ensure modal shows
    }
  }, [onClose, wizardActive, isOpen, hasSeenIntro])

  const handleStartOnboarding = () => {
    setShowAuthStep(true)
  }

  const handleContinue = () => {
    localStorage.setItem('hasSeenNeighborhoodFinderIntro', 'true')
    // Check wizardActive from localStorage as well, in case context hasn't updated
    const isWizardActive = wizardActive || localStorage.getItem('wizard_active') === 'true'
    if (isWizardActive) {
      setWizardStep('neighborhood-finder')
      router.push('/neighborhood-finder')
      setTimeout(() => {
        onClose()
      }, 100)
    } else {
      onClose()
    }
  }

  // Don't render if not open
  if (!isOpen) return null

  // In wizard mode, always show if isOpen is true
  // Only auto-close if not in wizard mode and already seen
  if (!wizardActive) {
    const seen = localStorage.getItem('hasSeenNeighborhoodFinderIntro')
    if (seen === 'true') {
      return null
    }
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
        maxWidth: isMobile ? '100%' : '700px',
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
          padding: isMobile ? '0.75rem 1rem' : '1.5rem',
          borderBottom: '1px solid #e0e0e0',
          background: 'linear-gradient(135deg, #0070f3 0%, #0051cc 100%)',
          borderRadius: isMobile ? '0' : '12px 12px 0 0',
          color: '#fff',
          flexShrink: 0,
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: 1
            }}
            title="Dismiss"
          >
            &times;
          </button>
          <h2 style={{
            margin: 0,
            fontSize: isMobile ? '1.25rem' : '1.75rem',
            fontWeight: '700',
            color: '#fff'
          }}>
            {showAuthStep ? 'One Final Step' : 'How RushRoost Works'}
          </h2>
          {!showAuthStep && (
            <p style={{
              margin: isMobile ? '0.25rem 0 0 0' : '0.5rem 0 0 0',
              fontSize: isMobile ? '0.875rem' : '1rem',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              Follow these simple steps to find your perfect home
            </p>
          )}
        </div>

        {/* Content */}
        {!showAuthStep ? (
          <div style={{
            padding: isMobile ? '1rem' : '2rem',
            fontSize: isMobile ? '0.875rem' : '1rem',
            lineHeight: isMobile ? '1.5' : '1.7',
            color: '#333',
            flex: 1,
            overflowY: 'auto'
          }}>
            {[
              { num: 1, title: 'Enter Your Work Address' },
              { num: 2, title: 'Find Towns Within Your Commute' },
              { num: 3, title: 'Find a Home on Zillow' },
              { num: 4, title: 'See the True Commute Time' }
            ].map((step) => (
              <div key={step.num} style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                <div style={{
                  flexShrink: 0,
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#0070f3',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: '700'
                }}>
                  {step.num}
                </div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#000' }}>{step.title}</h3>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '2rem',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            backgroundColor: '#f9f9f9'
          }}>
            {status === 'authenticated' ? (
              <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#000' }}>You're all set, {session.user?.name?.split(' ')[0]}!</h3>
                <p style={{ color: '#666', marginBottom: '2rem' }}>You've successfully signed in. We'll automatically use our guest API key to calculate your commutes.</p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#000' }}>Sign In to Activate</h3>
                <p style={{ color: '#666', marginBottom: '2rem', maxWidth: '400px' }}>
                  To provide accurate commute times using our Google Maps integration, please sign in with your Google account.
                </p>
                <button
                  onClick={() => signIn('google')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 24px',
                    backgroundColor: '#fff',
                    color: '#3c4043',
                    border: '1px solid #dadce0',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(60,64,67,0.3)',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.01.68-2.33 1.09-3.71 1.09-2.85 0-5.27-1.92-6.13-4.51H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.87 14.15c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.13H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.87l3.69-2.72z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.13l3.69 2.72c.86-2.59 3.28-4.51 6.13-4.51z" fill="#EA4335" />
                  </svg>
                  Sign In with Google
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          backgroundColor: '#f9f9f9',
          flexShrink: 0
        }}>
          {!showAuthStep ? (
            <>
              <button
                onClick={onClose}
                style={{ padding: '0.75rem 1.5rem', backgroundColor: 'transparent', color: '#666', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Skip intro
              </button>
              <button
                onClick={handleStartOnboarding}
                style={{
                  padding: '0.75rem 2rem',
                  backgroundColor: '#0070f3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Next
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowAuthStep(false)}
                style={{ padding: '0.75rem 1.5rem', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Back
              </button>
              <button
                onClick={handleContinue}
                disabled={status !== 'authenticated'}
                style={{
                  padding: '0.75rem 2rem',
                  backgroundColor: status === 'authenticated' ? '#28a745' : '#ccc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: status === 'authenticated' ? 'pointer' : 'not-allowed',
                  fontWeight: '600'
                }}
              >
                Start Exploring
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}


