'use client'

import { useState, useEffect, useRef, memo } from 'react'
import StreetView from './StreetView'
import { useApiKey } from '@/contexts/ApiKeyContext'

interface MapStreetViewToggleProps {
  location: { lat: number; lng: number } | null
  width?: number
  height?: number
}

function MapStreetViewToggle({
  location,
  width = 400,
  height = 300,
}: MapStreetViewToggleProps) {
  const [viewMode, setViewMode] = useState<'street' | 'map'>('map')
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const [isMapInitialized, setIsMapInitialized] = useState(false)
  const { isLoading: apiKeyLoading, getEffectiveApiKey } = useApiKey()

  // Initialize map when switching to map view
  useEffect(() => {
    if (viewMode !== 'map' || !location || apiKeyLoading) {
      return
    }

    const initMap = async () => {
      try {
        // Get the effective API key (user's key or shared key if consented)
        const apiKey = await getEffectiveApiKey()
        if (!apiKey) {
          return
        }

        // Check if Google Maps is already loaded
        if (!window.google || !window.google.maps) {
          const { Loader } = await import('@googlemaps/js-api-loader')
          const loader = new Loader({
            apiKey: apiKey,
            version: 'weekly',
            libraries: ['places'],
          })
          await loader.load()
        }

        // Wait a bit for the DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100))

        if (mapRef.current) {
          // If map already exists, just update it
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter({ lat: location.lat, lng: location.lng })
            if (markerRef.current) {
              markerRef.current.setPosition({ lat: location.lat, lng: location.lng })
            }
          } else {
            // Create new map
            const map = new google.maps.Map(mapRef.current, {
              center: { lat: location.lat, lng: location.lng },
              zoom: 18,
              mapTypeId: 'roadmap',
              disableDefaultUI: false,
              zoomControl: true,
              mapTypeControl: true,
              scaleControl: true,
              streetViewControl: false,
              fullscreenControl: true,
            })

            // Add a marker for the location
            const marker = new google.maps.Marker({
              position: { lat: location.lat, lng: location.lng },
              map: map,
              title: 'Property Location',
            })

            mapInstanceRef.current = map
            markerRef.current = marker
            setIsMapInitialized(true)
          }
        }
      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }

    initMap()
  }, [viewMode, location?.lat, location?.lng, apiKeyLoading, getEffectiveApiKey])


  if (!location) {
    return (
      <div style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: '#f0f0f0',
        border: '1px solid #ddd',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666',
        fontSize: '0.875rem'
      }}>
        Enter an address to see map/street view
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {/* Toggle buttons */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={() => setViewMode('street')}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            backgroundColor: viewMode === 'street' ? '#0070f3' : '#fff',
            color: viewMode === 'street' ? '#fff' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: viewMode === 'street' ? '600' : '400',
            transition: 'all 0.2s'
          }}
        >
          Street View
        </button>
        <button
          onClick={() => setViewMode('map')}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            backgroundColor: viewMode === 'map' ? '#0070f3' : '#fff',
            color: viewMode === 'map' ? '#fff' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: viewMode === 'map' ? '600' : '400',
            transition: 'all 0.2s'
          }}
        >
          Map View
        </button>
      </div>

      {/* View container */}
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
        {/* Street View */}
        {viewMode === 'street' && (
          <StreetView location={location} width={width} height={height} />
        )}

        {/* Map View */}
        {viewMode === 'map' && (
          <div
            ref={mapRef}
            style={{
              width: '100%',
              height: '100%'
            }}
          />
        )}
      </div>
    </div>
  )
}

// Memoize component to prevent re-renders when props haven't changed
export default memo(MapStreetViewToggle, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render), false if different (re-render)
  if (prevProps.location === nextProps.location) {
    return prevProps.width === nextProps.width && prevProps.height === nextProps.height
  }
  if (!prevProps.location || !nextProps.location) {
    return prevProps.location === nextProps.location
  }
  // Check if location coordinates are effectively the same
  const locationSame = (
    Math.abs(prevProps.location.lat - nextProps.location.lat) < 0.0001 &&
    Math.abs(prevProps.location.lng - nextProps.location.lng) < 0.0001
  )
  return locationSame && 
         prevProps.width === nextProps.width && 
         prevProps.height === nextProps.height
})

