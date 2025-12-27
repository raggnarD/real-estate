'use client'

import { useState, useEffect, useRef } from 'react'
import { useWizard } from '@/contexts/WizardContext'
import NeighborhoodFinderIntro from '@/components/NeighborhoodFinderIntro'

/**
 * Modal that shows the "How RushRoost Works" and API key setup flow
 * Triggered when user clicks "Get Started" on the intro modal
 */
export default function WizardOnboardingModal() {
  const { wizardActive } = useWizard()
  const [showModal, setShowModal] = useState(false)
  const hasCheckedRef = useRef(false)

  useEffect(() => {
    // Check if we should show the modal
    const checkShouldShow = () => {
      try {
        const hasSeenIntro = localStorage.getItem('hasSeenIntro')
        const hasSeenHowItWorks = localStorage.getItem('hasSeenNeighborhoodFinderIntro')
        const wizardActiveFromStorage = localStorage.getItem('wizard_active') === 'true'
        
        // Show if (wizard is active in context OR in storage) AND intro was seen but how-it-works hasn't been seen
        const shouldShow = (wizardActive || wizardActiveFromStorage) && hasSeenIntro === 'true' && !hasSeenHowItWorks
        
        if (shouldShow) {
          setShowModal(true)
          hasCheckedRef.current = true
        } else if (!wizardActive && !wizardActiveFromStorage) {
          // Only hide if wizard is definitely not active
          setShowModal(false)
        }
      } catch (error) {
        console.error('Error checking wizard modal state:', error)
      }
    }

    // Check immediately when wizardActive changes
    if (wizardActive) {
      checkShouldShow()
    }

    // Also poll for changes to catch localStorage updates
    const interval = setInterval(checkShouldShow, 100)

    return () => clearInterval(interval)
  }, [wizardActive])

  // Listen for custom event when wizard starts
  useEffect(() => {
    const handleWizardStarted = () => {
      const hasSeenIntro = localStorage.getItem('hasSeenIntro')
      const hasSeenHowItWorks = localStorage.getItem('hasSeenNeighborhoodFinderIntro')
      
      if (hasSeenIntro === 'true' && !hasSeenHowItWorks) {
        setShowModal(true)
      }
    }

    window.addEventListener('wizard-started', handleWizardStarted)
    return () => window.removeEventListener('wizard-started', handleWizardStarted)
  }, [])

  // Also check on mount
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('hasSeenIntro')
    const hasSeenHowItWorks = localStorage.getItem('hasSeenNeighborhoodFinderIntro')
    const wizardActiveFromStorage = localStorage.getItem('wizard_active') === 'true'
    
    if ((wizardActive || wizardActiveFromStorage) && hasSeenIntro === 'true' && !hasSeenHowItWorks) {
      setShowModal(true)
    }
  }, [wizardActive])

  const handleClose = () => {
    setShowModal(false)
  }

  if (!showModal) return null

  return (
    <NeighborhoodFinderIntro 
      isOpen={showModal}
      onClose={handleClose}
    />
  )
}

