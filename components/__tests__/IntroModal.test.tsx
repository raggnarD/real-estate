import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
    setWizardStep: jest.fn(),
  }),
}))

describe('IntroModal', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render when isOpen is true', async () => {
    render(<IntroModal isOpen={true} onClose={mockOnClose} />)
    await waitFor(() => {
      expect(screen.getByText(/welcome to rushroost/i)).toBeInTheDocument()
    })
  })

  it('should not render when isOpen is false', () => {
    const { container } = render(<IntroModal isOpen={false} onClose={mockOnClose} />)
    expect(container.firstChild).toBeNull()
  })

  it('should call onClose when close button is clicked', async () => {
    render(<IntroModal isOpen={true} onClose={mockOnClose} />)
    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)
    })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should show NeighborhoodFinderIntro when Get Started is clicked', async () => {
    render(<IntroModal isOpen={true} onClose={mockOnClose} />)
    await waitFor(() => {
      const getStartedButton = screen.getByRole('button', { name: /get started/i })
      fireEvent.click(getStartedButton)
    })
    await waitFor(() => {
      expect(screen.getByTestId('neighborhood-finder-intro')).toBeInTheDocument()
    })
  })
})

