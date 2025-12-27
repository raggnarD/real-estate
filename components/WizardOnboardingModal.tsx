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

  useEffect(() => {
    // Check if we should show the modal
    const checkShouldShow = () => {
      try {
        const hasSeenIntro = localStorage.getItem('hasSeenIntro')
        const hasSeenHowItWorks = localStorage.getItem('hasSeenNeighborhoodFinderIntro')
        const wizardActiveFromStorage = localStorage.getItem('wizard_active') === 'true'
        
        // Show if (wizard is active in context OR in storage) AND intro was seen but how-it-works hasn't been seen
        const shouldShow = (wizardActive || wizardActiveFromStorage) && hasSeenIntro === 'true' && !hasSeenHowItWorks
        
        setShowModal(shouldShow)
      } catch (error) {
        console.error('Error checking wizard modal state:', error)
      }
    }

    // Check immediately
    checkShouldShow()

    // Poll for changes (since localStorage changes in same window don't trigger storage events)
    // Check frequently to catch the change quickly
    const interval = setInterval(checkShouldShow, 50)

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

