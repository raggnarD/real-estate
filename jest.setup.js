// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Fix React.act for React 19 compatibility
// React Testing Library needs React.act to be available
// In React 19, act is exported directly from 'react' and should work with @testing-library/react 16+
// The testing library should handle this automatically, but we ensure it's available
const React = require('react')

// React 19 exports act directly from 'react'
// @testing-library/react 16+ should handle this automatically
// If React.act is not available, try to get it from react
if (React && typeof React.act === 'undefined') {
  try {
    const { act } = require('react')
    if (act && typeof act === 'function') {
      React.act = act
    }
  } catch (e) {
    // If that fails, try react-dom/test-utils (older React versions)
    try {
      const { act } = require('react-dom/test-utils')
      if (act && typeof act === 'function') {
        React.act = act
      }
    } catch (e2) {
      // Last resort: create a wrapper
      React.act = (callback) => {
        if (typeof callback === 'function') {
          return callback()
        }
      }
    }
  }
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

