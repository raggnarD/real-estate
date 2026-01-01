'use client'

import { useEffect, useRef, useState } from 'react'
import { useApiKey } from '@/contexts/ApiKeyContext'

interface CommuteMapProps {
  origin: { lat: number; lng: number } | { placeId: string } | null
  destination: { lat: number; lng: number } | null
  transitStop?: { lat: number; lng: number; name: string; placeId?: string } | null
  leg1Mode?: 'walking' | 'driving' | null
  transitType?: 'bus' | 'train' | null
  mode?: 'driving' | 'walking' | 'bicycling' | 'transit'
  width?: number
  height?: number
  arrivalTime?: number // Unix timestamp in seconds
}

export default function CommuteMap({
  origin,
  destination,
  transitStop = null,
  leg1Mode = null,
  transitType = null,
  mode = 'driving',
  width = 800,
  height = 600,
  arrivalTime,
}: CommuteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null)
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const leg1RendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const leg2RendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isLoading: apiKeyLoading, getEffectiveApiKey } = useApiKey()

  useEffect(() => {
    if (!origin || !destination || apiKeyLoading) {
      setIsLoading(false)
      return
    }

    // Check if this is a multi-leg transit journey
    const isMultiLeg = transitStop && leg1Mode && transitType

    const initMap = async () => {
      try {
        // Get the effective API key (user's key or shared key if consented)
        const apiKey = await getEffectiveApiKey()
        if (!apiKey) {
          setIsLoading(false)
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

        if (!mapRef.current) return

        // Create map if it doesn't exist
        // Handle case where origin might be a placeId - use destination or default center
        const originIsPlaceId = origin && typeof origin === 'object' && 'placeId' in origin
        const mapCenter = originIsPlaceId 
          ? (destination || { lat: 0, lng: 0 })
          : (origin as { lat: number; lng: number } | null) || destination || { lat: 0, lng: 0 }
        
        if (!mapInstanceRef.current) {
          const map = new google.maps.Map(mapRef.current, {
            center: mapCenter,
            zoom: 12,
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

        // Initialize Directions Service
        if (!directionsServiceRef.current) {
          directionsServiceRef.current = new google.maps.DirectionsService()
        }

        // Clear previous renderers and markers
        if (leg1RendererRef.current) {
          leg1RendererRef.current.setMap(null)
        }
        if (leg2RendererRef.current) {
          leg2RendererRef.current.setMap(null)
        }
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setMap(null)
        }
        // Clear previous markers
        markersRef.current.forEach(marker => marker.setMap(null))
        markersRef.current = []

        if (isMultiLeg) {
          // Multi-leg transit journey
          const leg1Renderer = new google.maps.DirectionsRenderer({
            map: mapInstanceRef.current,
            suppressMarkers: true,
            preserveViewport: false,
            polylineOptions: {
              strokeColor: '#0070f3',
              strokeWeight: 5,
              strokeOpacity: 0.8,
            },
          })

          const leg2Renderer = new google.maps.DirectionsRenderer({
            map: mapInstanceRef.current,
            suppressMarkers: true,
            preserveViewport: false,
            polylineOptions: {
              strokeColor: '#00a86b',
              strokeWeight: 5,
              strokeOpacity: 0.8,
            },
          })

          leg1RendererRef.current = leg1Renderer
          leg2RendererRef.current = leg2Renderer

          // Calculate bounds to fit all points
          // Handle case where origin might be a placeId
          const originIsPlaceId = origin && typeof origin === 'object' && 'placeId' in origin
          const originCoords = originIsPlaceId ? null : origin as { lat: number; lng: number } | null
          
          const bounds = new google.maps.LatLngBounds()
          if (originCoords) {
            bounds.extend(originCoords)
          }
          if (transitStop) bounds.extend(transitStop)
          bounds.extend(destination)
          mapInstanceRef.current.fitBounds(bounds)

          // Add custom markers
          // Only add origin marker if we have coordinates (not placeId)
          const originMarker = originCoords ? new google.maps.Marker({
            position: originCoords,
            map: mapInstanceRef.current,
            title: 'Origin',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#0070f3',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 3,
            },
            zIndex: 1000,
          }) : null

          const transitMarker = new google.maps.Marker({
            position: transitStop!,
            map: mapInstanceRef.current,
            title: transitStop!.name || 'Transit Stop',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#ff9800',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 3,
            },
            zIndex: 1000,
          })

          const destinationMarker = new google.maps.Marker({
            position: destination,
            map: mapInstanceRef.current,
            title: 'Destination',
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

          markersRef.current = originMarker 
            ? [originMarker, transitMarker, destinationMarker]
            : [transitMarker, destinationMarker]

          // Request Leg 1: Origin to Transit Stop
          const leg1Request: google.maps.DirectionsRequest = {
            origin: origin as any,
            destination: transitStop!,
            travelMode: leg1Mode === 'walking' ? google.maps.TravelMode.WALKING : google.maps.TravelMode.DRIVING,
          }

          directionsServiceRef.current.route(leg1Request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              leg1Renderer.setDirections(result)
            } else {
              console.error('Leg 1 directions error:', status)
              setError(`Failed to calculate route to transit stop: ${status}`)
            }
          })

          // Request Leg 2: Transit Stop to Destination
          // Use place_id if available for better transit routing, otherwise use coordinates
          const leg2Origin = transitStop!.placeId 
            ? { placeId: transitStop!.placeId } as any
            : transitStop!
            
          const leg2Request: google.maps.DirectionsRequest = {
            origin: leg2Origin,
            destination: destination,
            travelMode: google.maps.TravelMode.TRANSIT,
            transitOptions: {
              modes: [transitType === 'bus' ? google.maps.TransitMode.BUS : google.maps.TransitMode.RAIL],
              routingPreference: google.maps.TransitRoutePreference.LESS_WALKING,
            },
          }
          
          // Add arrival time if provided (for transit, this ensures accurate scheduling)
          // Note: arrivalTime is supported by the API but not in TypeScript definitions
          if (arrivalTime) {
            (leg2Request as any).arrivalTime = new Date(arrivalTime * 1000)
          }

          directionsServiceRef.current.route(leg2Request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              leg2Renderer.setDirections(result)
              setIsLoading(false)
            } else {
              console.error('Leg 2 directions error:', status, result)
              console.error('Leg 2 request details:', {
                origin: leg2Origin,
                destination: destination,
                transitType: transitType,
                arrivalTime: arrivalTime
              })
              setError(`Failed to calculate transit route: ${status}`)
              setIsLoading(false)
            }
          })
        } else {
          // Single-leg journey (driving, walking, bicycling)
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

          // Calculate bounds and add markers
          // Handle case where origin might be a placeId object
          const originIsPlaceId = origin && typeof origin === 'object' && 'placeId' in origin
          const originCoords = originIsPlaceId ? null : origin as { lat: number; lng: number } | null
          
          if (originCoords) {
            const bounds = new google.maps.LatLngBounds()
            bounds.extend(originCoords)
            bounds.extend(destination)
            mapInstanceRef.current.fitBounds(bounds)

            // Add custom markers
            const originMarker = new google.maps.Marker({
              position: originCoords,
              map: mapInstanceRef.current,
              title: 'Origin',
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
              position: destination,
              map: mapInstanceRef.current,
              title: 'Destination',
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
          } else {
            // For placeId origins, let the directions renderer handle bounds and markers
            // We'll set bounds after getting the route result
            markersRef.current = []
          }

          // Convert mode to Google Maps TravelMode
          let travelMode: google.maps.TravelMode
          switch (mode) {
            case 'walking':
              travelMode = google.maps.TravelMode.WALKING
              break
            case 'bicycling':
              travelMode = google.maps.TravelMode.BICYCLING
              break
            case 'transit':
              travelMode = google.maps.TravelMode.TRANSIT
              break
            default:
              travelMode = google.maps.TravelMode.DRIVING
          }

          // Request route
          const routeRequest: google.maps.DirectionsRequest = {
            origin: origin as any,
            destination: destination,
            travelMode: travelMode,
          }
          
          // Add transit options if transit mode and transitType is specified
          if (travelMode === google.maps.TravelMode.TRANSIT && transitType) {
            routeRequest.transitOptions = {
              modes: [transitType === 'bus' ? google.maps.TransitMode.BUS : google.maps.TransitMode.RAIL],
              routingPreference: google.maps.TransitRoutePreference.LESS_WALKING,
            }
          }
          
          // Add arrival time if provided (only for transit mode)
          // Note: arrivalTime is supported for transit mode by the API but not in TypeScript definitions
          // For driving mode, the API route handles departure_time calculation
          if (arrivalTime && travelMode === google.maps.TravelMode.TRANSIT) {
            (routeRequest as any).arrivalTime = new Date(arrivalTime * 1000)
          }

          directionsServiceRef.current.route(routeRequest, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              directionsRenderer.setDirections(result)
              // If origin was a placeId, fit bounds to the route
              if (originIsPlaceId && result.routes && result.routes.length > 0 && mapInstanceRef.current) {
                const bounds = new google.maps.LatLngBounds()
                result.routes[0].legs.forEach(leg => {
                  bounds.extend(leg.start_location)
                  bounds.extend(leg.end_location)
                })
                mapInstanceRef.current.fitBounds(bounds)
              }
              setIsLoading(false)
            } else {
              console.error('Directions error:', status)
              setError(`Failed to calculate route: ${status}`)
              setIsLoading(false)
            }
          })
        }
      } catch (error) {
        console.error('Error initializing map:', error)
        setError('Failed to load map')
        setIsLoading(false)
      }
    }

    initMap()

    // Cleanup
    return () => {
      if (leg1RendererRef.current) {
        leg1RendererRef.current.setMap(null)
      }
      if (leg2RendererRef.current) {
        leg2RendererRef.current.setMap(null)
      }
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null)
      }
      markersRef.current.forEach(marker => marker.setMap(null))
      markersRef.current = []
    }
  }, [origin, transitStop, destination, leg1Mode, transitType, mode, arrivalTime, apiKeyLoading, getEffectiveApiKey])

  if (!origin || !destination) {
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
        Complete commute calculation to view route map
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
          Loading route...
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
      {transitStop && leg1Mode && transitType ? (
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
          <div style={{ marginBottom: '0.25rem', fontWeight: '600' }}>Route Legend:</div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
            <div style={{ width: '20px', height: '3px', backgroundColor: '#0070f3', marginRight: '0.5rem' }}></div>
            <span>Leg 1: {leg1Mode === 'walking' ? 'Walking' : 'Driving'} to Transit</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '3px', backgroundColor: '#00a86b', marginRight: '0.5rem' }}></div>
            <span>Leg 2: {transitType === 'bus' ? 'Bus' : 'Train'} to Destination</span>
          </div>
        </div>
      ) : (
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
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '3px', backgroundColor: '#0070f3', marginRight: '0.5rem' }}></div>
            <span>Route: {mode === 'walking' ? 'Walking' : mode === 'bicycling' ? 'Bicycling' : mode === 'transit' ? 'Transit' : 'Driving'}</span>
          </div>
        </div>
      )}
    </div>
  )
}

