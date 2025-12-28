'use client'

import { useState, useEffect } from 'react'
import { useWizard } from '@/contexts/WizardContext'
import NeighborhoodFinderIntro from '@/components/NeighborhoodFinderIntro'

/**
 * Modal that shows the "How RushRoost Works" and API key setup flow
 * Triggered when user clicks "Get Started" on the intro modal
 */
export default function WizardOnboardingModal() {
  const { wizardActive } = useWizard()
  const [showModal, setShowModal] = useState(false)

  // Listen for custom event when wizard starts - this is the primary trigger
  useEffect(() => {
    const handleWizardStarted = () => {
      // Small delay to ensure localStorage is updated
      setTimeout(() => {
        const hasSeenIntro = localStorage.getItem('hasSeenIntro')
        const hasSeenHowItWorks = localStorage.getItem('hasSeenNeighborhoodFinderIntro')
        
        if (hasSeenIntro === 'true' && !hasSeenHowItWorks) {
          setShowModal(true)
        }
      }, 10)
    }

    window.addEventListener('wizard-started', handleWizardStarted as EventListener)
    return () => window.removeEventListener('wizard-started', handleWizardStarted as EventListener)
  }, [])

  // Also check when wizardActive changes
  useEffect(() => {
    if (wizardActive) {
      const hasSeenIntro = localStorage.getItem('hasSeenIntro')
      const hasSeenHowItWorks = localStorage.getItem('hasSeenNeighborhoodFinderIntro')
      
      if (hasSeenIntro === 'true' && !hasSeenHowItWorks) {
        setShowModal(true)
      }
    }
  }, [wizardActive])

  // Poll as fallback
  useEffect(() => {
    const checkShouldShow = () => {
      try {
        const hasSeenIntro = localStorage.getItem('hasSeenIntro')
        const hasSeenHowItWorks = localStorage.getItem('hasSeenNeighborhoodFinderIntro')
        const wizardActiveFromStorage = localStorage.getItem('wizard_active') === 'true'
        
        const shouldShow = (wizardActive || wizardActiveFromStorage) && hasSeenIntro === 'true' && !hasSeenHowItWorks
        
        if (shouldShow) {
          setShowModal(true)
        }
      } catch (error) {
        console.error('Error checking wizard modal state:', error)
      }
    }

    const interval = setInterval(checkShouldShow, 200)
    return () => clearInterval(interval)
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

