'use client'

import { useEffect, useRef, useState } from 'react'

interface CityResult {
  name: string
  address: string
  location: { lat: number; lng: number }
  commuteTime: number
  commuteTimeText: string
  distance: string
  distanceValue: number
  placeId: string
}

interface NeighborhoodMapProps {
  workLocation: { lat: number; lng: number }
  cities: CityResult[]
  selectedCityId?: string
  onCitySelect?: (city: CityResult) => void
  width?: number
  height?: number
}

export default function NeighborhoodMap({
  workLocation,
  cities,
  selectedCityId,
  onCitySelect,
  width = 400,
  height = 600,
}: NeighborhoodMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const infoWindowsRef = useRef<google.maps.InfoWindow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!workLocation || cities.length === 0) {
      setIsLoading(false)
      return
    }

    const initMap = async () => {
      try {
        // Check if Google Maps is already loaded
        if (!window.google || !window.google.maps) {
          const { Loader } = await import('@googlemaps/js-api-loader')
          const loader = new Loader({
            apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
            version: 'weekly',
            libraries: ['places'],
          })
          await loader.load()
        }

        // Wait a bit for the DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100))

        if (!mapRef.current) return

        // Clear previous markers and info windows
        markersRef.current.forEach(marker => marker.setMap(null))
        infoWindowsRef.current.forEach(iw => iw.close())
        markersRef.current = []
        infoWindowsRef.current = []

        // Create map if it doesn't exist
        if (!mapInstanceRef.current) {
          const map = new google.maps.Map(mapRef.current, {
            center: workLocation,
            zoom: 10,
            mapTypeId: 'roadmap',
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: true,
            scaleControl: true,
            streetViewControl: false,
            fullscreenControl: true,
          })
          mapInstanceRef.current = map
        }

        const map = mapInstanceRef.current

        // Add marker for work location
        const workMarker = new google.maps.Marker({
          position: workLocation,
          map: map,
          title: 'Work Location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#ff0000',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 3,
          },
          zIndex: 1000,
        })

        const workInfoWindow = new google.maps.InfoWindow({
          content: '<div style="padding: 0.5rem;"><strong>Work Location</strong></div>',
        })

        workMarker.addListener('click', () => {
          infoWindowsRef.current.forEach(iw => iw.close())
          workInfoWindow.open(map, workMarker)
        })

        markersRef.current.push(workMarker)
        infoWindowsRef.current.push(workInfoWindow)

        // Add markers for cities
        cities.forEach((city) => {
          const isSelected = selectedCityId === city.placeId
          const marker = new google.maps.Marker({
            position: city.location,
            map: map,
            title: city.name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: isSelected ? 10 : 8,
              fillColor: isSelected ? '#0070f3' : '#00a86b',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: isSelected ? 3 : 2,
            },
            zIndex: isSelected ? 1000 : 100,
          })

          const infoContent = `
            <div style="padding: 0.5rem; min-width: 200px;">
              <div style="font-weight: 600; margin-bottom: 0.25rem; font-size: 1rem;">${city.name}</div>
              <div style="font-size: 0.875rem; color: #666; margin-bottom: 0.5rem;">${city.address}</div>
              <div style="font-size: 0.875rem;">
                <div style="color: #0070f3; margin-bottom: 0.25rem;">⏱️ ${city.commuteTimeText}</div>
                <div style="color: #666;">📍 ${city.distance}</div>
              </div>
            </div>
          `

          const infoWindow = new google.maps.InfoWindow({
            content: infoContent,
          })

          marker.addListener('click', () => {
            infoWindowsRef.current.forEach(iw => iw.close())
            infoWindow.open(map, marker)
            if (onCitySelect) {
              onCitySelect(city)
            }
          })

          markersRef.current.push(marker)
          infoWindowsRef.current.push(infoWindow)
        })

        // Fit bounds to show all markers
        const bounds = new google.maps.LatLngBounds()
        bounds.extend(workLocation)
        cities.forEach(city => bounds.extend(city.location))
        map.fitBounds(bounds)

        // Adjust zoom if too zoomed out
        const listener = google.maps.event.addListener(map, 'bounds_changed', () => {
          if (map.getZoom() && map.getZoom()! > 15) {
            map.setZoom(15)
          }
          google.maps.event.removeListener(listener)
        })

        setIsLoading(false)
      } catch (error) {
        console.error('Error initializing map:', error)
        setError('Failed to load map')
        setIsLoading(false)
      }
    }

    initMap()

    // Cleanup
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null))
      infoWindowsRef.current.forEach(iw => iw.close())
      markersRef.current = []
      infoWindowsRef.current = []
    }
  }, [workLocation, cities, selectedCityId, onCitySelect])

  if (!workLocation || cities.length === 0) {
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
        {!workLocation ? 'Enter work address to see map' : 'No cities found'}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: `${width}px`, height: `${height}px` }}>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '8px',
          border: '1px solid #ddd',
          overflow: 'hidden',
        }}
      />
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          fontSize: '0.875rem',
          color: '#666',
          zIndex: 1000,
        }}>
          Loading map...
        </div>
      )}
      {error && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: '#fee',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          fontSize: '0.875rem',
          color: '#c00',
          zIndex: 1000,
          border: '1px solid #fcc',
        }}>
          {error}
        </div>
      )}
      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '0.75rem',
        borderRadius: '4px',
        fontSize: '0.75rem',
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }}>
        <div style={{ marginBottom: '0.25rem', fontWeight: '600' }}>Legend:</div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#ff0000', borderRadius: '50%', marginRight: '0.5rem' }}></div>
          <span>Work Location</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#00a86b', borderRadius: '50%', marginRight: '0.5rem' }}></div>
          <span>Cities</span>
        </div>
      </div>
    </div>
  )
}



