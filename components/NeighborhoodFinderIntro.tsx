'use client'

import { useState, useEffect } from 'react'

interface NeighborhoodFinderIntroProps {
  isOpen: boolean
  onClose: () => void
}

export default function NeighborhoodFinderIntro({ isOpen, onClose }: NeighborhoodFinderIntroProps) {
  const [hasSeenIntro, setHasSeenIntro] = useState(false)

  useEffect(() => {
    // Check if user has seen this intro before
    const seen = localStorage.getItem('hasSeenNeighborhoodFinderIntro')
    if (seen === 'true') {
      setHasSeenIntro(true)
      onClose() // Auto-close if already seen
    }
  }, [onClose])

  const handleGotIt = () => {
    localStorage.setItem('hasSeenNeighborhoodFinderIntro', 'true')
    setHasSeenIntro(true)
    onClose()
  }

  if (!isOpen || hasSeenIntro) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '0.5rem',
      overflow: 'auto'
    }} onClick={handleGotIt}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        margin: '0 auto'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e0e0e0',
          background: 'linear-gradient(135deg, #0070f3 0%, #0051cc 100%)',
          borderRadius: '12px 12px 0 0',
          color: '#fff'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#fff'
          }}>
            How RushRoost Works
          </h2>
          <p style={{
            margin: '0.5rem 0 0 0',
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            Follow these 4 simple steps to find your perfect home
          </p>
        </div>

        {/* Content */}
        <div style={{
          padding: '2rem',
          fontSize: '1rem',
          lineHeight: '1.7',
          color: '#333'
        }}>
          {/* Step 1 */}
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            marginBottom: '2rem',
            alignItems: 'flex-start'
          }}>
            <div style={{
              flexShrink: 0,
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: '#0070f3',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: '700'
            }}>
              1
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#000'
              }}>
                Enter Your Work Address
              </h3>
              <p style={{
                margin: 0,
                fontSize: '1rem',
                color: '#666',
                lineHeight: '1.6'
              }}>
                Start by entering your work address. This will be your reference point for calculating commute times to potential homes.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            marginBottom: '2rem',
            alignItems: 'flex-start'
          }}>
            <div style={{
              flexShrink: 0,
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: '#0070f3',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: '700'
            }}>
              2
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#000'
              }}>
                Find Towns Within Your Commute Time
              </h3>
              <p style={{
                margin: 0,
                fontSize: '1rem',
                color: '#666',
                lineHeight: '1.6'
              }}>
                Set your maximum commute time and discover all the cities and towns that are within your desired travel time. Browse through the results to find areas that interest you.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            marginBottom: '2rem',
            alignItems: 'flex-start'
          }}>
            <div style={{
              flexShrink: 0,
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: '#0070f3',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: '700'
            }}>
              3
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#000'
              }}>
                Find a Home on Zillow
              </h3>
              <p style={{
                margin: 0,
                fontSize: '1rem',
                color: '#666',
                lineHeight: '1.6'
              }}>
                Click "View on Zillow" for any town that catches your interest. Browse available homes on Zillow and find a property you'd like to explore further.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            marginBottom: '0',
            alignItems: 'flex-start'
          }}>
            <div style={{
              flexShrink: 0,
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: '#0070f3',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: '700'
            }}>
              4
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#000'
              }}>
                See the True Commute Time
              </h3>
              <p style={{
                margin: 0,
                fontSize: '1rem',
                color: '#666',
                lineHeight: '1.6'
              }}>
                Copy the Zillow URL for a property you're interested in and paste it into the True Commute Time page. Your work address will be automatically filled in, and you'll get an accurate, real-time commute time calculation.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'flex-end',
          backgroundColor: '#f9f9f9',
          borderRadius: '0 0 12px 12px'
        }}>
          <button
            onClick={handleGotIt}
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
            Got it!
          </button>
        </div>
      </div>
    </div>
  )
}

