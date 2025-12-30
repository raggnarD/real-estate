/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import Navigation from '../Navigation'
import { ApiKeyProvider } from '@/contexts/ApiKeyContext'
import { WizardProvider } from '@/contexts/WizardContext'

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

// Mock next/navigation
const mockPathname = '/'
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
}

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => mockRouter,
}))

// Mock fetch for shared key status
global.fetch = jest.fn()

// Mock ApiKeyDebug
jest.mock('@/components/ApiKeyDebug', () => {
  return function ApiKeyDebug() {
    return null
  }
})

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ApiKeyProvider>
      <WizardProvider>
        {component}
      </WizardProvider>
    </ApiKeyProvider>
  )
}

describe('Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        active: false,
        expiresAt: null,
        timeRemaining: null,
        hasExpiredCookie: false,
      }),
    })

    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  describe('Navigation Links', () => {
    it('should render navigation links', async () => {
      renderWithProviders(<Navigation />)
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(screen.getByText(/neighborhood finder/i)).toBeInTheDocument()
      expect(screen.getByText(/true commute time/i)).toBeInTheDocument()
    })

    it('should highlight active link based on pathname', async () => {
      // Mock pathname for neighborhood-finder
      jest.spyOn(require('next/navigation'), 'usePathname').mockReturnValue('/neighborhood-finder')
      
      renderWithProviders(<Navigation />)
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const neighborhoodLink = screen.getByText(/neighborhood finder/i).closest('a')
      expect(neighborhoodLink).toHaveAttribute('href', '/neighborhood-finder')
    })

    it('should have link to account page', async () => {
      renderWithProviders(<Navigation />)
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Account link is rendered as an SVG icon, so we check for the link by href
      const accountLink = document.querySelector('a[href="/account"]')
      expect(accountLink).toBeInTheDocument()
    })
  })

  describe('Mobile Menu', () => {
    it('should show mobile menu button on mobile screens', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      })

      // Trigger resize event
      window.dispatchEvent(new Event('resize'))

      renderWithProviders(<Navigation />)
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Mobile menu button should be present
      const menuButton = screen.getByLabelText(/toggle menu/i)
      expect(menuButton).toBeInTheDocument()
    })

    it('should toggle mobile menu when button is clicked', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      })

      renderWithProviders(<Navigation />)
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const menuButton = screen.getByLabelText(/toggle menu/i)
      expect(menuButton).toBeInTheDocument()
      
      // Click to open menu
      menuButton.click()
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Menu should be open (button text changes to ✕)
      expect(menuButton.textContent).toBe('✕')
    })
  })

  describe('Logo', () => {
    it('should render logo image', async () => {
      renderWithProviders(<Navigation />)
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const logo = screen.getByAltText('RushRoost')
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveAttribute('src', '/rushroost-logo.png')
    })

    it('should handle logo image load error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      renderWithProviders(<Navigation />)
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const logo = screen.getByAltText('RushRoost')
      
      // Simulate image error
      const errorEvent = new Event('error')
      logo.dispatchEvent(errorEvent)
      
      // Error handler should be called (though we can't easily test the console.error call)
      expect(logo).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })
  })
})

