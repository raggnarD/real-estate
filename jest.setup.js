// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Fix React.act for React 19 compatibility
// React Testing Library needs React.act to be available
const React = require('react')
if (React && !React.act) {
  const { act } = require('react')
  React.act = act
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock Google Maps API
global.google = {
  maps: {
    Geocoder: jest.fn(),
    GeocoderStatus: {
      OK: 'OK',
      ERROR: 'ERROR',
    },
    places: {
      AutocompleteService: jest.fn(),
      PlacesService: jest.fn(),
    },
  },
}

