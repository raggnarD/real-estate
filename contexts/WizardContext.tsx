'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

type WizardStep = 'account' | 'neighborhood-finder' | 'commute-time' | null

interface WizardContextType {
  wizardActive: boolean
  wizardStep: WizardStep
  workAddress: string | null
  setWizardActive: (active: boolean) => void
  setWizardStep: (step: WizardStep) => void
  setWorkAddress: (address: string | null) => void
  completeWizard: () => void
}

const WizardContext = createContext<WizardContextType | undefined>(undefined)

const WIZARD_WORK_ADDRESS_KEY = 'wizard_work_address'
const WIZARD_COMPLETED_KEY = 'wizard_completed'
const WIZARD_ACTIVE_KEY = 'wizard_active'
const WIZARD_STEP_KEY = 'wizard_step'

export function WizardProvider({ children }: { children: ReactNode }) {
  const [wizardActive, setWizardActiveState] = useState<boolean>(false)
  const [wizardStep, setWizardStepState] = useState<WizardStep>(null)
  const [workAddress, setWorkAddressState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load wizard state from localStorage on mount
  useEffect(() => {
    try {
      const storedActive = localStorage.getItem(WIZARD_ACTIVE_KEY)
      const storedStep = localStorage.getItem(WIZARD_STEP_KEY)
      const storedWorkAddress = localStorage.getItem(WIZARD_WORK_ADDRESS_KEY)
      const wizardCompleted = localStorage.getItem(WIZARD_COMPLETED_KEY)

      // Only restore wizard state if wizard hasn't been completed
      if (!wizardCompleted) {
        if (storedActive === 'true') {
          setWizardActiveState(true)
        }
        if (storedStep) {
          setWizardStepState(storedStep as WizardStep)
        }
        if (storedWorkAddress) {
          setWorkAddressState(storedWorkAddress)
        }
      }
    } catch (error) {
      console.error('Error loading wizard state:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Persist wizard active state to localStorage
  const setWizardActive = useCallback((active: boolean) => {
    setWizardActiveState(active)
    try {
      if (active) {
        localStorage.setItem(WIZARD_ACTIVE_KEY, 'true')
      } else {
        localStorage.removeItem(WIZARD_ACTIVE_KEY)
      }
    } catch (error) {
      console.error('Error saving wizard active state:', error)
    }
  }, [])

  // Persist wizard step to localStorage
  const setWizardStep = useCallback((step: WizardStep) => {
    setWizardStepState(step)
    try {
      if (step) {
        localStorage.setItem(WIZARD_STEP_KEY, step)
      } else {
        localStorage.removeItem(WIZARD_STEP_KEY)
      }
    } catch (error) {
      console.error('Error saving wizard step:', error)
    }
  }, [])

  // Persist work address to localStorage
  const setWorkAddress = useCallback((address: string | null) => {
    setWorkAddressState(address)
    try {
      if (address) {
        localStorage.setItem(WIZARD_WORK_ADDRESS_KEY, address)
      } else {
        localStorage.removeItem(WIZARD_WORK_ADDRESS_KEY)
      }
    } catch (error) {
      console.error('Error saving work address:', error)
    }
  }, [])

  // Mark wizard as complete
  const completeWizard = useCallback(() => {
    setWizardActiveState(false)
    setWizardStepState(null)
    try {
      localStorage.setItem(WIZARD_COMPLETED_KEY, 'true')
      localStorage.removeItem(WIZARD_ACTIVE_KEY)
      localStorage.removeItem(WIZARD_STEP_KEY)
      // Keep work address in case user wants to use it later
    } catch (error) {
      console.error('Error completing wizard:', error)
    }
  }, [])

  return (
    <WizardContext.Provider
      value={{
        wizardActive,
        wizardStep,
        workAddress,
        setWizardActive,
        setWizardStep,
        setWorkAddress,
        completeWizard,
      }}
    >
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard() {
  const context = useContext(WizardContext)
  if (context === undefined) {
    throw new Error('useWizard must be used within a WizardProvider')
  }
  return context
}


