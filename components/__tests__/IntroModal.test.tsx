import { render, screen, fireEvent } from '@testing-library/react'
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

describe('IntroModal', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render when isOpen is true', () => {
    render(<IntroModal isOpen={true} onClose={mockOnClose} />)
    expect(screen.getByText(/welcome to rushroost/i)).toBeInTheDocument()
  })

  it('should not render when isOpen is false', () => {
    const { container } = render(<IntroModal isOpen={false} onClose={mockOnClose} />)
    expect(container.firstChild).toBeNull()
  })

  it('should call onClose when close button is clicked', () => {
    render(<IntroModal isOpen={true} onClose={mockOnClose} />)
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should show NeighborhoodFinderIntro when Get Started is clicked', () => {
    render(<IntroModal isOpen={true} onClose={mockOnClose} />)
    const getStartedButton = screen.getByRole('button', { name: /get started/i })
    fireEvent.click(getStartedButton)
    expect(screen.getByTestId('neighborhood-finder-intro')).toBeInTheDocument()
  })
})

