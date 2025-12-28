'use client'

import { usePathname } from 'next/navigation'
import { useWizard } from '@/contexts/WizardContext'
import { useApiKey } from '@/contexts/ApiKeyContext'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Stage {
  number: number
  title: string
  icon: string
  description: string
}

const stages: Stage[] = [
  {
    number: 1,
    title: 'Enter Your Work Address',
    icon: '🏢',
    description: 'Start by entering your work address'
  },
  {
    number: 2,
    title: 'Find Towns Within Your Commute',
    icon: '🗺️',
    description: 'Discover cities within your commute time'
  },
  {
    number: 3,
    title: 'Find a Home on Zillow',
    icon: '🏠',
    description: 'Browse homes on Zillow'
  },
  {
    number: 4,
    title: 'See the True Commute Time',
    icon: '⏱️',
    description: 'Get accurate commute time for your home'
  }
]

export default function StageGate() {
  const pathname = usePathname()
  const { wizardActive, wizardStep, workAddress } = useWizard()
  const { apiKey, sharedKeyActive } = useApiKey()
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [hasNeighborhoodResults, setHasNeighborhoodResults] = useState(false)
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

  useEffect(() => {
    // Only show stage gate if wizard is active
    if (!wizardActive) {
      setCurrentStep(0)
      return
    }

    // Check if neighborhood results exist in localStorage
    const checkNeighborhoodResults = () => {
      try {
        // Check if there are any results stored (we can check for a marker in localStorage)
        // For now, we'll use a simple check - if work address exists and we're on neighborhood finder
        // we'll assume step 1, and we can update to step 2 when results are found
        // This is a simple approach - in a real app you might want to use a context or prop
        return false // Will be updated when results are found
      } catch {
        return false
      }
    }

    // Determine current step based on pathname and state
    if (pathname === '/neighborhood-finder') {
      // Step 1: On neighborhood finder page (entering work address)
      // Step 2: After finding neighborhoods (we'll need to detect this)
      // For now, we'll show step 1, and can enhance later to detect step 2
      setCurrentStep(hasNeighborhoodResults ? 2 : 1)
    } else if (pathname === '/') {
      // Step 4: On True Commute Time page
      setCurrentStep(4)
    } else {
      // Other pages (like account) - don't show
      setCurrentStep(0)
    }
  }, [pathname, wizardActive, wizardStep, workAddress, hasNeighborhoodResults])

  // Listen for custom events when neighborhoods are found (step 2) or cleared (back to step 1)
  useEffect(() => {
    const handleNeighborhoodsFound = () => {
      if (pathname === '/neighborhood-finder') {
        setHasNeighborhoodResults(true)
      }
    }

    const handleNeighborhoodsCleared = () => {
      if (pathname === '/neighborhood-finder') {
        setHasNeighborhoodResults(false)
      }
    }

    window.addEventListener('neighborhoods-found', handleNeighborhoodsFound as EventListener)
    window.addEventListener('neighborhoods-cleared', handleNeighborhoodsCleared as EventListener)
    return () => {
      window.removeEventListener('neighborhoods-found', handleNeighborhoodsFound as EventListener)
      window.removeEventListener('neighborhoods-cleared', handleNeighborhoodsCleared as EventListener)
    }
  }, [pathname])

  // Don't show if wizard is not active or no API key is set
  if (!wizardActive || (!apiKey && !sharedKeyActive)) {
    return null
  }

  // Don't show on account page
  if (pathname === '/account') {
    return null
  }

  // Get the current active stage
  const activeStage = stages.find(stage => stage.number === currentStep)

  if (!activeStage) {
    return null
  }

  return (
    <div style={{
      backgroundColor: '#f9f9f9',
      borderBottom: '1px solid #e0e0e0',
      padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
      marginBottom: isMobile ? '1rem' : '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isMobile ? '0.5rem' : '1rem',
        flexWrap: 'wrap'
      }}>
        {stages.map((stage, index) => {
          const isActive = currentStep === stage.number
          const isCompleted = currentStep > stage.number
          const isUpcoming = currentStep < stage.number

          return (
            <div
              key={stage.number}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '0.5rem' : '1rem',
                flex: index === 0 || index === stages.length - 1 ? '0 0 auto' : 1,
                position: 'relative'
              }}
            >
              {/* Step Number Circle */}
              <div style={{
                width: isMobile ? '36px' : '44px',
                height: isMobile ? '36px' : '44px',
                borderRadius: '50%',
                backgroundColor: isCompleted 
                  ? '#28a745' 
                  : isActive 
                    ? '#0070f3' 
                    : '#e0e0e0',
                color: isCompleted || isActive ? '#fff' : '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: isMobile ? '0.875rem' : '1rem',
                flexShrink: 0,
                transition: 'all 0.3s',
                border: isActive ? '3px solid #0056b3' : 'none',
                boxShadow: isActive ? '0 2px 8px rgba(0, 112, 243, 0.3)' : 'none'
              }}>
                {isCompleted ? '✓' : stage.number}
              </div>

              {/* Current Stage Text - only show next to active circle */}
              {isActive && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  marginLeft: isMobile ? '0.25rem' : '0.5rem'
                }}>
                  <div style={{
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    fontWeight: '600',
                    color: '#0070f3',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    whiteSpace: 'nowrap'
                  }}>
                    <span style={{ fontSize: isMobile ? '1rem' : '1.125rem' }}>{stage.icon}</span>
                    <span>{stage.title}</span>
                  </div>
                  {!isMobile && (
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#666',
                      whiteSpace: 'nowrap'
                    }}>
                      {stage.description}
                    </div>
                  )}
                </div>
              )}

              {/* Connector Line (except for last item) */}
              {index < stages.length - 1 && (
                <div style={{
                  flex: 1,
                  height: '2px',
                  backgroundColor: isCompleted ? '#28a745' : '#e0e0e0',
                  minWidth: isMobile ? '20px' : '40px',
                  maxWidth: isMobile ? '60px' : '120px',
                  transition: 'background-color 0.3s'
                }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

