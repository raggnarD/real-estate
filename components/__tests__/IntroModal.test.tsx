import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import IntroModal from '../IntroModal'

// Mock the NeighborhoodFinderIntro component
jest.mock('../NeighborhoodFinderIntro', () => {
  return function MockNeighborhoodFinderIntro({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null
    return (
      <div data-testid="neighborhood-finder-intro">
        <button onClick={onClose}>Close</button>
      </div>
    )
  }
})

// Mock WizardContext
jest.mock('@/contexts/WizardContext', () => ({
  useWizard: () => ({
    wizardActive: false,
    setWizardActive: jest.fn(),
    setWizardStep: jest.fn(),
  }),
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('IntroModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null) // Default: hasn't seen intro
  })

  it('should render when user has not seen intro', async () => {
    localStorageMock.getItem.mockReturnValue(null)
    render(<IntroModal />)
    await waitFor(() => {
      expect(screen.getByText(/welcome to rushroost/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should not render when user has seen intro', () => {
    localStorageMock.getItem.mockReturnValue('true')
    const { container } = render(<IntroModal />)
    expect(container.firstChild).toBeNull()
  })
})

