'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useApiKey } from '@/contexts/ApiKeyContext'
import { Loader } from '@googlemaps/js-api-loader'
import TransitStopDirectionsMap from './TransitStopDirectionsMap'

interface TransitStop {
  name: string
  address: string
  location: { lat: number; lng: number }
  distance: string
  distanceValue: number
  placeId: string
  type?: string
}

interface TransitStopsModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectStop: (stop: TransitStop) => void
  selectedStop: TransitStop | null
  initialStops: TransitStop[]
  fetchStops: (offset: number) => Promise<{ stops: TransitStop[]; hasMore: boolean }>
  transportMode: 'bus' | 'train'
  originLocation: { lat: number; lng: number } | null
}

export default function TransitStopsModal({
  isOpen,
  onClose,
  onSelectStop,
  selectedStop,
  initialStops,
  fetchStops,
  transportMode,
  originLocation
}: TransitStopsModalProps) {
  const { getEffectiveApiKey } = useApiKey()
  const [isMobile, setIsMobile] = useState(false)
  const [stops, setStops] = useState<TransitStop[]>(initialStops)
  const [currentOffset, setCurrentOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [pageHistory, setPageHistory] = useState<number[]>([0]) // Track page offsets
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [previewStop, setPreviewStop] = useState<TransitStop | null>(selectedStop) // Track preview selection
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const fetchStopsRef = useRef(fetchStops) // Store fetchStops in a ref to avoid dependency issues
  
  // Update ref when fetchStops changes
  useEffect(() => {
    fetchStopsRef.current = fetchStops
  }, [fetchStops])

  // Calculate map center
  const mapCenter = originLocation || (stops.length > 0 ? stops[0].location : null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Only load initial stops when modal opens, not when other dependencies change
  useEffect(() => {
    if (!isOpen) return
    
    // Initialize preview stop to the currently selected stop
    setPreviewStop(selectedStop)
    
    // When modal opens, always fetch 10 stops from the beginning
    const loadInitialStops = async () => {
      setIsLoading(true)
      try {
        // Use ref to avoid dependency on fetchStops function
        const result = await fetchStopsRef.current(0)
        if (result.stops.length > 0) {
          setStops(result.stops)
          setHasMore(result.hasMore)
          // Don't auto-select - preserve the current selection if it exists in the new list
          // If selectedStop exists, check if it's in the new list, otherwise keep it
          if (selectedStop) {
            const isSelectedStopInList = result.stops.some(s => s.placeId === selectedStop.placeId)
            if (!isSelectedStopInList) {
              // Selected stop is not in the first 10, so we need to keep the selection
              // but the user will need to navigate to find it or select a new one
            }
          }
        } else {
          // Fallback to initial stops if fetch fails
          setStops(initialStops)
          setHasMore(false)
        }
      } catch (error) {
        console.error('Error loading initial stops:', error)
        // Fallback to initial stops if fetch fails
        setStops(initialStops)
        setHasMore(false)
      } finally {
        setIsLoading(false)
      }
      setCurrentOffset(0)
      setPageHistory([0])
      setCurrentPageIndex(0)
    }
    loadInitialStops()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]) // Only depend on isOpen - use refs for other values

  // Initialize map - only runs when modal opens or stops change
  useEffect(() => {
    if (!isOpen || !mapCenter || !stops.length) return

    let isMounted = true

    const initMap = async () => {
      try {
        const apiKey = await getEffectiveApiKey()
        if (!apiKey || !isMounted) return

        // Only load Google Maps API if map doesn't exist
        if (!mapInstanceRef.current) {
          const loader = new Loader({
            apiKey,
            version: 'weekly',
            libraries: ['places']
          })

          await loader.load()
        }

        if (!mapRef.current || !isMounted) return

        // Create map if it doesn't exist
        if (!mapInstanceRef.current) {
          const map = new google.maps.Map(mapRef.current, {
            center: mapCenter,
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true
          })
          mapInstanceRef.current = map
        }

        const map = mapInstanceRef.current

        // Clear existing markers and their listeners
        markersRef.current.forEach(marker => {
          google.maps.event.clearInstanceListeners(marker)
          marker.setMap(null)
        })
        markersRef.current = []

        // Create bounds to fit all stops
        const bounds = new google.maps.LatLngBounds()

        // Add markers for each stop
        stops.forEach((stop) => {
          const marker = new google.maps.Marker({
            position: stop.location,
            map,
            title: stop.name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: previewStop?.placeId === stop.placeId ? '#0070f3' : '#6c757d',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2
            }
          })

          // Add click listener - preview the stop instead of selecting immediately
          marker.addListener('click', () => {
            setPreviewStop(stop)
          })

          markersRef.current.push(marker)
          bounds.extend(stop.location)
        })
        
        // Fit bounds to show all markers
        if (stops.length > 1) {
          map.fitBounds(bounds)
        } else if (stops.length === 1) {
          map.setCenter(stops[0].location)
          map.setZoom(15)
        }
      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }

    initMap()

    return () => {
      isMounted = false
    }
  }, [isOpen, stops, mapCenter, getEffectiveApiKey])

  // Update map when previewStop changes - only update markers and center, don't re-initialize
  useEffect(() => {
    if (!isOpen || !mapInstanceRef.current || !stops.length) return

    const map = mapInstanceRef.current

    // Update marker colors based on previewStop
    markersRef.current.forEach((marker, index) => {
      const stop = stops[index]
      if (stop && marker) {
        const isPreviewed = previewStop?.placeId === stop.placeId
        marker.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: isPreviewed ? '#0070f3' : '#6c757d',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2
        })
      }
    })

    // Center map on preview stop if one is selected
    if (previewStop) {
      const previewStopInList = stops.find(s => s.placeId === previewStop.placeId)
      if (previewStopInList) {
        map.setCenter(previewStopInList.location)
        map.setZoom(15)
      }
    }
  }, [previewStop, stops, isOpen])

  const loadNextPage = async () => {
    if (isLoading || !hasMore) return
    
    setIsLoading(true)
    try {
      const nextOffset = currentOffset + 10
      const result = await fetchStopsRef.current(nextOffset)
      
      if (result.stops.length > 0) {
        setStops(result.stops)
        setCurrentOffset(nextOffset)
        setHasMore(result.hasMore)
        
        // Add to page history
        const newHistory = [...pageHistory, nextOffset]
        setPageHistory(newHistory)
        setCurrentPageIndex(newHistory.length - 1)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more stops:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const goToPreviousPage = async () => {
    if (isLoading || currentPageIndex === 0) return
    
    setIsLoading(true)
    try {
      const prevOffset = pageHistory[currentPageIndex - 1]
      const result = await fetchStopsRef.current(prevOffset)
      
      if (result.stops.length > 0) {
        setStops(result.stops)
        setCurrentOffset(prevOffset)
        setHasMore(true) // Assume there's more since we're going back
        setCurrentPageIndex(currentPageIndex - 1)
      }
    } catch (error) {
      console.error('Error loading previous stops:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: isMobile ? 'flex-start' : 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: isMobile ? '0' : '1rem',
      overflow: 'auto'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: isMobile ? '0' : '12px',
        maxWidth: isMobile ? '100%' : '1200px',
        width: '100%',
        height: isMobile ? '100dvh' : '90vh',
        maxHeight: isMobile ? '100dvh' : '90vh',
        overflow: 'hidden',
        boxShadow: isMobile ? 'none' : '0 8px 32px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        margin: isMobile ? '0' : '0 auto',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1rem 1.5rem' : '1.5rem',
          borderBottom: '1px solid #e0e0e0',
          background: 'linear-gradient(135deg, #0070f3 0%, #0051cc 100%)',
          borderRadius: isMobile ? '0' : '12px 12px 0 0',
          color: '#fff',
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff'
          }}>
            {transportMode === 'bus' ? '🚌 Bus' : '🚂 Train'} Stops
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1.5rem',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          {/* Stops List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '1rem' : '1.5rem',
            borderRight: isMobile ? 'none' : '1px solid #e0e0e0',
            borderBottom: isMobile ? '1px solid #e0e0e0' : 'none'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {stops.map((stop) => (
                <label
                  key={stop.placeId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem',
                    border: previewStop?.placeId === stop.placeId ? '2px solid #0070f3' : '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: previewStop?.placeId === stop.placeId ? '#e6f2ff' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (previewStop?.placeId !== stop.placeId) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (previewStop?.placeId !== stop.placeId) {
                      e.currentTarget.style.backgroundColor = '#fff'
                    }
                  }}
                >
                  <input
                    type="radio"
                    name="modalTransitStop"
                    value={stop.placeId}
                    checked={previewStop?.placeId === stop.placeId}
                    onChange={() => {
                      console.log('Modal: Stop previewed', { name: stop.name, placeId: stop.placeId, address: stop.address })
                      setPreviewStop(stop)
                    }}
                    style={{ marginRight: '0.75rem' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <div style={{ fontWeight: '500' }}>
                        {stop.name}
                      </div>
                      {stop.type && (
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.125rem 0.5rem',
                          backgroundColor: stop.type === 'Subway' ? '#0070f3' : stop.type === 'Train' ? '#00a86b' : '#6c757d',
                          color: '#fff',
                          borderRadius: '12px',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          {stop.type}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                      {stop.address}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#0070f3' }}>
                      {stop.distance} away
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {/* Pagination Controls */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginTop: '1rem',
              justifyContent: 'center'
            }}>
              {currentPageIndex > 0 && (
                <button
                  onClick={goToPreviousPage}
                  disabled={isLoading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: isLoading ? '#ccc' : '#6c757d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = '#5a6268'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = '#6c757d'
                    }
                  }}
                >
                  ← Previous
                </button>
              )}
              {hasMore && (
                <button
                  onClick={loadNextPage}
                  disabled={isLoading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: isLoading ? '#ccc' : '#0070f3',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = '#0056b3'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = '#0070f3'
                    }
                  }}
                >
                  {isLoading ? 'Loading...' : 'Load More →'}
                </button>
              )}
            </div>
          </div>

          {/* Map */}
          {mapCenter && (
            <div style={{
              flex: 1,
              minHeight: isMobile ? '300px' : 'auto',
              borderTop: isMobile ? '1px solid #e0e0e0' : 'none',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {previewStop && originLocation ? (
                <TransitStopDirectionsMap
                  origin={originLocation}
                  destination={{
                    lat: previewStop.location.lat,
                    lng: previewStop.location.lng,
                    name: previewStop.name
                  }}
                  mode="driving"
                  width={undefined}
                  height={isMobile ? 300 : undefined}
                />
              ) : (
                <div 
                  ref={mapRef}
                  style={{ 
                    width: '100%', 
                    height: isMobile ? '300px' : '100%',
                    minHeight: isMobile ? '300px' : '400px'
                  }}
                />
              )}
            </div>
          )}
        </div>
        
        {/* Footer with Confirm Button */}
        <div style={{
          padding: isMobile ? '1rem 1.5rem' : '1.5rem',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          backgroundColor: '#f9f9f9',
          borderRadius: isMobile ? '0' : '0 0 12px 12px',
          flexShrink: 0
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#5a6268'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#6c757d'
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (previewStop) {
                onSelectStop(previewStop)
                onClose()
              }
            }}
            disabled={!previewStop}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: previewStop ? '#0070f3' : '#ccc',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: previewStop ? 'pointer' : 'not-allowed',
              fontWeight: '600',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (previewStop) {
                e.currentTarget.style.backgroundColor = '#0056b3'
              }
            }}
            onMouseLeave={(e) => {
              if (previewStop) {
                e.currentTarget.style.backgroundColor = '#0070f3'
              }
            }}
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  )
}

