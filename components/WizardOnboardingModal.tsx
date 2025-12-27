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
      const hasSeenIntro = localStorage.getItem('hasSeenIntro')
      const hasSeenHowItWorks = localStorage.getItem('hasSeenNeighborhoodFinderIntro')
      
      // Show if wizard is active AND intro was seen but how-it-works hasn't been seen
      if (wizardActive && hasSeenIntro === 'true' && !hasSeenHowItWorks) {
        setShowModal(true)
      } else {
        setShowModal(false)
      }
    }

    // Check immediately
    checkShouldShow()

    // Poll for changes (since localStorage changes in same window don't trigger storage events)
    // Check more frequently to catch the change quickly
    const interval = setInterval(checkShouldShow, 100)

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

