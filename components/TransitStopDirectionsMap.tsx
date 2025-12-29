'use client'

import { useEffect, useRef, useState } from 'react'
import { useApiKey } from '@/contexts/ApiKeyContext'
import { Loader } from '@googlemaps/js-api-loader'

interface TransitStopDirectionsMapProps {
  origin: { lat: number; lng: number } | null
  destination: { lat: number; lng: number; name: string } | null
  mode: 'walking' | 'driving'
  width?: number
  height?: number
}

export default function TransitStopDirectionsMap({
  origin,
  destination,
  mode = 'driving',
  width = 400,
  height = 300,
}: TransitStopDirectionsMapProps) {
  const { getEffectiveApiKey } = useApiKey()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null)
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!origin || !destination || !mapRef.current) return

    let isMounted = true

    const initMap = async () => {
      try {
        const apiKey = await getEffectiveApiKey()
        if (!apiKey || !isMounted) return

        // Load Google Maps API if needed
        if (!window.google || !window.google.maps) {
          const loader = new Loader({
            apiKey,
            version: 'weekly',
            libraries: ['places'],
          })
          await loader.load()
        }

        if (!mapRef.current || !isMounted) return

        // Create map if it doesn't exist
        if (!mapInstanceRef.current) {
          const map = new google.maps.Map(mapRef.current, {
            center: origin,
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          })
          mapInstanceRef.current = map
        }

        // Initialize directions service
        if (!directionsServiceRef.current) {
          directionsServiceRef.current = new google.maps.DirectionsService()
        }

        // Clear previous renderer
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setMap(null)
        }

        // Clear previous markers
        markersRef.current.forEach(marker => marker.setMap(null))
        markersRef.current = []

        // Create directions renderer
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map: mapInstanceRef.current,
          suppressMarkers: true,
          preserveViewport: false,
          polylineOptions: {
            strokeColor: '#0070f3',
            strokeWeight: 5,
            strokeOpacity: 0.8,
          },
        })

        directionsRendererRef.current = directionsRenderer

        // Calculate bounds to fit both points
        const bounds = new google.maps.LatLngBounds()
        bounds.extend(origin)
        bounds.extend({ lat: destination.lat, lng: destination.lng })
        mapInstanceRef.current.fitBounds(bounds)

        // Add custom markers
        const originMarker = new google.maps.Marker({
          position: origin,
          map: mapInstanceRef.current,
          title: 'Starting Address',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#0070f3',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 3,
          },
          zIndex: 1000,
        })

        const destinationMarker = new google.maps.Marker({
          position: { lat: destination.lat, lng: destination.lng },
          map: mapInstanceRef.current,
          title: destination.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#00a86b',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 3,
          },
          zIndex: 1000,
        })

        markersRef.current = [originMarker, destinationMarker]

        // Request directions
        const request: google.maps.DirectionsRequest = {
          origin: origin,
          destination: { lat: destination.lat, lng: destination.lng },
          travelMode: mode === 'walking' ? google.maps.TravelMode.WALKING : google.maps.TravelMode.DRIVING,
        }

        directionsServiceRef.current.route(request, (result, status) => {
          if (!isMounted) return

          if (status === google.maps.DirectionsStatus.OK && result && directionsRendererRef.current) {
            directionsRendererRef.current.setDirections(result)
            setIsLoading(false)
          } else {
            console.error('Directions error:', status)
            setIsLoading(false)
          }
        })
      } catch (error) {
        console.error('Error initializing map:', error)
        setIsLoading(false)
      }
    }

    initMap()

    return () => {
      isMounted = false
      // Cleanup
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null)
      }
      markersRef.current.forEach(marker => marker.setMap(null))
    }
  }, [origin, destination, mode, getEffectiveApiKey])

  if (!origin || !destination) {
    return (
      <div style={{
        width: width ? `${width}px` : '100%',
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
        {!origin ? 'Enter starting address' : 'Select a transit stop'}
      </div>
    )
  }

  return (
    <div style={{
      width: width ? `${width}px` : '100%',
      height: `${height}px`,
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid #ddd',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'relative',
      backgroundColor: '#f0f0f0'
    }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 1000
        }}>
          <div style={{ color: '#666', fontSize: '0.875rem' }}>Loading directions...</div>
        </div>
      )}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  )
}

