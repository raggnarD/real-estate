'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface StreetViewProps {
  location: { lat: number; lng: number } | null
  width?: number
  height?: number
  fov?: number
  heading?: number
  pitch?: number
}

export default function StreetView({ 
  location, 
  width = 400, 
  height = 300,
  fov = 90,
  heading = 0,
  pitch = 0
}: StreetViewProps) {
  const panoramaRef = useRef<HTMLDivElement>(null)
  const streetViewRef = useRef<google.maps.StreetViewPanorama | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize Google Maps API
  useEffect(() => {
    const initStreetView = async () => {
      if (isInitialized) return

      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (!apiKey) {
          setError('Google Maps API key not configured')
          return
        }

        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
          setIsInitialized(true)
          return
        }

        // Use the same libraries as AddressAutocomplete to avoid conflicts
        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['places'], // Match AddressAutocomplete to avoid loader conflicts
        })

        await loader.load()
        setIsInitialized(true)
      } catch (error) {
        console.error('Error loading Google Maps:', error)
        setError('Failed to load Google Maps. Please check your API key and ensure Maps JavaScript API is enabled.')
      }
    }

    initStreetView()
  }, [isInitialized])

  // Initialize Street View Panorama
  useEffect(() => {
    if (!isInitialized || !location || !panoramaRef.current) {
      // Clean up existing panorama if location is cleared
      if (!location && streetViewRef.current) {
        streetViewRef.current = null
      }
      return
    }

    // Clean up existing panorama before creating new one
    if (streetViewRef.current) {
      streetViewRef.current = null
    }

    setIsLoading(true)
    setError(null)

    try {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        if (!panoramaRef.current) return

        // Create Street View Panorama
        const panorama = new google.maps.StreetViewPanorama(panoramaRef.current, {
          position: { lat: location.lat, lng: location.lng },
          pov: {
            heading: heading,
            pitch: pitch,
          },
          zoom: 1,
          visible: true,
          enableCloseButton: false,
          addressControl: false,
          linksControl: true,
          panControl: true,
          zoomControl: true,
          fullscreenControl: false,
        })

        // Handle Street View status
        panorama.addListener('status_changed', () => {
          const status = panorama.getStatus()
          setIsLoading(false)
          
          if (status === google.maps.StreetViewStatus.OK) {
            setError(null)
          } else if (status === google.maps.StreetViewStatus.ZERO_RESULTS) {
            setError('Street View imagery is not available for this location')
          } else if (status === google.maps.StreetViewStatus.NOT_FOUND) {
            setError('Street View not found for this location')
          } else {
            setError('Street View is not available')
          }
        })

        streetViewRef.current = panorama
      }, 100)
    } catch (err) {
      console.error('Error initializing Street View:', err)
      setError('Failed to initialize Street View')
      setIsLoading(false)
    }

    return () => {
      if (streetViewRef.current) {
        streetViewRef.current = null
      }
    }
  }, [location?.lat, location?.lng, isInitialized, heading, pitch])


  return (
    <div style={{
      width: `${width}px`,
      height: `${height}px`,
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid #ddd',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'relative',
      backgroundColor: '#f0f0f0'
    }}>
      {!location && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#666',
          fontSize: '0.875rem',
          textAlign: 'center',
          zIndex: 1
        }}>
          Enter an address to see Street View
        </div>
      )}
      {isLoading && location && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#666',
          fontSize: '0.875rem',
          zIndex: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '0.5rem 1rem',
          borderRadius: '4px'
        }}>
          Loading Street View...
        </div>
      )}
      {error && location && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#666',
          fontSize: '0.875rem',
          textAlign: 'center',
          padding: '1rem',
          zIndex: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '4px',
          maxWidth: '90%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ marginBottom: '0.5rem', fontWeight: '500' }}>{error}</div>
          <div style={{ fontSize: '0.75rem', color: '#999' }}>
            Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
          </div>
        </div>
      )}
      <div
        ref={panoramaRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '100%'
        }}
      />
    </div>
  )
}

