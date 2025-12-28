'use client'

import { useState, useEffect, useMemo } from 'react'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import AddressHistory from '@/components/AddressHistory'
import MapStreetViewToggle from '@/components/MapStreetViewToggle'
import CommuteMap from '@/components/CommuteMap'
import { useScrollToResults } from '@/hooks/useScrollToResults'
import { useApiKey } from '@/contexts/ApiKeyContext'
import { useWizard } from '@/contexts/WizardContext'

interface SearchResults {
  address?: string
  location?: { lat: number; lng: number }
  zillowData?: { zpid: string; url: string }
  error?: string
}

interface TransitStop {
  name: string
  address: string
  location: { lat: number; lng: number }
  distance: string
  distanceValue: number
  placeId: string
}

interface CommuteResults {
  distance?: string
  duration?: string
  mode?: string
  leg1?: { distance: string; duration: string; distanceValue: number; durationValue: number }
  leg2?: { distance: string; duration: string; distanceValue: number; durationValue: number }
  total?: { distance: string; duration: string; distanceValue: number; durationValue: number }
  transitType?: 'bus' | 'train'
  error?: string
}

const ADDRESS_HISTORY_KEY = 'real-estate-address-history'
const DESTINATION_HISTORY_KEY = 'real-estate-destination-history'
const MAX_HISTORY_ITEMS = 3

export default function Home() {
  const { apiKey } = useApiKey()
  const { wizardActive, workAddress: wizardWorkAddress, setWizardStep } = useWizard()
  const [isMobile, setIsMobile] = useState(false)
  const [address, setAddress] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [zillowUrl, setZillowUrl] = useState('')
  const [transportMode, setTransportMode] = useState<'driving' | 'bus' | 'train' | 'walking' | 'bicycling'>('driving')
  const [transitType, setTransitType] = useState<'bus' | 'train' | null>(null)
  const [transitStops, setTransitStops] = useState<TransitStop[]>([])
  const [selectedStop, setSelectedStop] = useState<TransitStop | null>(null)
  const [leg1Mode, setLeg1Mode] = useState<'walking' | 'driving' | null>(null)
  const [isLoadingStops, setIsLoadingStops] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [addressHistory, setAddressHistory] = useState<string[]>([])
  const [destinationHistory, setDestinationHistory] = useState<string[]>([])
  const [commuteResults, setCommuteResults] = useState<CommuteResults | null>(null)
  const [destinationLocation, setDestinationLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showWizardMessage, setShowWizardMessage] = useState(false)

  // Memoize origin location to prevent unnecessary re-renders
  const originLocation = useMemo(() => results?.location || null, [
    results?.location?.lat, 
    results?.location?.lng
  ])

  // Auto-scroll to results when they are displayed
  // Use isLoading as trigger so scroll happens when submission completes
  const hasResults = !!(commuteResults || (destinationAddress && results))
  const resultsRef = useScrollToResults(hasResults, 20, isLoading)

  // Load address history from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(ADDRESS_HISTORY_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setAddressHistory(Array.isArray(parsed) ? parsed : [])
        } catch (error) {
          console.error('Error loading address history:', error)
        }
      }
      
      const destStored = localStorage.getItem(DESTINATION_HISTORY_KEY)
      if (destStored) {
        try {
          const parsed = JSON.parse(destStored)
          setDestinationHistory(Array.isArray(parsed) ? parsed : [])
        } catch (error) {
          console.error('Error loading destination history:', error)
        }
      }
    }
  }, [])

  // Prepopulate work address from wizard if active
  useEffect(() => {
    if (wizardActive && wizardWorkAddress && !address) {
      setAddress(wizardWorkAddress)
      setWizardStep('commute-time')
      setShowWizardMessage(true)
      // Hide message after 5 seconds
      setTimeout(() => {
        setShowWizardMessage(false)
      }, 5000)
    }
  }, [wizardActive, wizardWorkAddress, address, setWizardStep])

  // Save address to history
  const saveToHistory = (addr: string) => {
    if (!addr || addr.trim() === '') return

    setAddressHistory((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((a) => a.toLowerCase() !== addr.toLowerCase())
      // Add to beginning and limit to MAX_HISTORY_ITEMS
      const updated = [addr, ...filtered].slice(0, MAX_HISTORY_ITEMS)
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(ADDRESS_HISTORY_KEY, JSON.stringify(updated))
      }
      
      return updated
    })
  }

  // Clear history
  const clearHistory = () => {
    setAddressHistory([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ADDRESS_HISTORY_KEY)
    }
  }

  // Save destination address to history
  const saveDestinationToHistory = (addr: string) => {
    if (!addr || addr.trim() === '') return

    setDestinationHistory((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((a) => a.toLowerCase() !== addr.toLowerCase())
      // Add to beginning and limit to MAX_HISTORY_ITEMS
      const updated = [addr, ...filtered].slice(0, MAX_HISTORY_ITEMS)
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(DESTINATION_HISTORY_KEY, JSON.stringify(updated))
      }
      
      return updated
    })
  }

  // Clear destination history
  const clearDestinationHistory = () => {
    setDestinationHistory([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DESTINATION_HISTORY_KEY)
    }
  }

  // Helper function to build API URL with apiKey parameter
  const buildApiUrl = (baseUrl: string, params: Record<string, string>) => {
    const url = new URL(baseUrl, window.location.origin)
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
    if (apiKey) {
      url.searchParams.append('apiKey', apiKey)
    }
    return url.toString()
  }

  // Select address from history
  const handleSelectFromHistory = async (addr: string) => {
    setAddress(addr)
    // Geocode immediately to show Street View
    try {
      const geocodeResponse = await fetch(
        buildApiUrl('/api/geocode', { address: addr })
      )
      const geocodeData = await geocodeResponse.json()
      
      if (geocodeResponse.ok && geocodeData.location) {
        setResults(prev => ({ 
          ...prev, 
          address: geocodeData.address,
          location: geocodeData.location 
        }))
        // Fetch transit stops if bus/train is selected
        if ((transportMode === 'bus' || transportMode === 'train') && geocodeData.location) {
          fetchTransitStops(geocodeData.location.lat, geocodeData.location.lng, transportMode)
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error)
    }
  }

  // Select destination from history
  const handleSelectDestinationFromHistory = async (addr: string) => {
    setDestinationAddress(addr)
    // Geocode immediately to show Street View
    try {
      const geocodeResponse = await fetch(
        buildApiUrl('/api/geocode', { address: addr })
      )
      const geocodeData = await geocodeResponse.json()
      
      if (geocodeResponse.ok && geocodeData.location) {
        setDestinationLocation(geocodeData.location)
      } else {
        setDestinationLocation(null)
      }
    } catch (error) {
      console.error('Destination geocoding error:', error)
      setDestinationLocation(null)
    }
  }

  const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
    setSelectedPlace(place)
    if (place.formatted_address) {
      setAddress(place.formatted_address)
    }
    // Set location immediately if available from place selection
    if (place.geometry?.location) {
      const locationObj = place.geometry.location
      const lat = typeof locationObj.lat === 'function' ? locationObj.lat() : locationObj.lat
      const lng = typeof locationObj.lng === 'function' ? locationObj.lng() : locationObj.lng
      
      const location: { lat: number; lng: number } = {
        lat: Number(lat),
        lng: Number(lng)
      }
      setResults(prev => ({ 
        ...prev, 
        location,
        address: place.formatted_address || prev?.address
      }))
      
      // Save to history immediately when we have a valid address and location (street view can be fetched)
      if (place.formatted_address) {
        saveToHistory(place.formatted_address)
        
        // Fetch transit stops if bus/train is selected
        if ((transportMode === 'bus' || transportMode === 'train')) {
          fetchTransitStops(location.lat, location.lng, transportMode)
        }
      }
    }
    // Reset transit-related state when address changes
    setTransitStops([])
    setSelectedStop(null)
    setLeg1Mode(null)
  }

  // Fetch transit stops when address is geocoded and bus/train is selected
  const fetchTransitStops = async (lat: number, lng: number, type: 'bus' | 'train') => {
    setIsLoadingStops(true)
    try {
      const response = await fetch(
        buildApiUrl('/api/transit-stops', { lat: lat.toString(), lng: lng.toString(), type })
      )
      const data = await response.json()
      
      if (response.ok && data.stops) {
        setTransitStops(data.stops)
        // Auto-select first stop if available
        if (data.stops.length > 0) {
          setSelectedStop(data.stops[0])
          setLeg1Mode('driving') // Default to driving
        }
      } else {
        setTransitStops([])
        setSelectedStop(null)
      }
    } catch (error) {
      console.error('Error fetching transit stops:', error)
      setTransitStops([])
      setSelectedStop(null)
    } finally {
      setIsLoadingStops(false)
    }
  }

  // Get address from Zillow URL
  const handleGetAddressFromZillow = async () => {
    if (!zillowUrl || !zillowUrl.trim()) {
      return
    }

    setIsLoading(true)
    try {
      // Process Zillow URL
      const zillowResponse = await fetch(
        `/api/zillow?url=${encodeURIComponent(zillowUrl)}`
      )
      const zillowData = await zillowResponse.json()
      
      if (zillowResponse.ok && zillowData.address) {
        // Set the extracted address
        setAddress(zillowData.address)
        
        // Geocode the extracted address
        const geocodeResponse = await fetch(
          buildApiUrl('/api/geocode', { address: zillowData.address })
        )
        const geocodeData = await geocodeResponse.json()
        
        if (geocodeResponse.ok && geocodeData.location) {
          // Update results with location for Street View
          setResults(prev => {
            // If location already exists and is the same, preserve the object reference
            if (prev?.location && 
                Math.abs(prev.location.lat - geocodeData.location.lat) < 0.0001 &&
                Math.abs(prev.location.lng - geocodeData.location.lng) < 0.0001) {
              return {
                ...prev,
                address: geocodeData.address,
                location: prev.location, // Preserve object reference
                zillowData: zillowData
              }
            }
            // New location or no previous location
            return {
              ...prev,
              address: geocodeData.address,
              location: geocodeData.location,
              zillowData: zillowData
            }
          })
          
          // Save to history
          saveToHistory(geocodeData.address)
          
          // Fetch transit stops if bus/train is selected
          if ((transportMode === 'bus' || transportMode === 'train') && geocodeData.location) {
            fetchTransitStops(geocodeData.location.lat, geocodeData.location.lng, transportMode)
          }
        } else {
          console.error('Failed to geocode Zillow address:', geocodeData.error)
        }
      } else {
        console.error('Failed to extract address from Zillow URL:', zillowData.error)
      }
    } catch (error) {
      console.error('Error getting address from Zillow URL:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setCommuteResults(null)

    try {
      const searchResults: SearchResults = {}
      let originAddress: string | null = null
      let destinationAddressGeocoded: string | null = null
      let addressToUse = address // Start with manually entered address

      // Process Zillow URL first if provided - this can populate the address
      if (zillowUrl) {
        try {
          const zillowResponse = await fetch(
            `/api/zillow?url=${encodeURIComponent(zillowUrl)}`
          )
          const zillowData = await zillowResponse.json()
          
          if (zillowResponse.ok) {
            searchResults.zillowData = zillowData
            
            // If address was extracted from Zillow URL, use it (override manual entry if Zillow URL is provided)
            if (zillowData.address) {
              addressToUse = zillowData.address
              setAddress(zillowData.address) // Update the input field
            }
          } else {
            searchResults.error = searchResults.error 
              ? `${searchResults.error}; ${zillowData.error}`
              : zillowData.error || 'Failed to process Zillow URL'
          }
        } catch (error) {
          console.error('Zillow processing error:', error)
          searchResults.error = searchResults.error 
            ? `${searchResults.error}; Failed to process Zillow URL`
            : 'Failed to process Zillow URL'
        }
      }

      // Check if origin address actually changed
      // Compare address strings first (fast check)
      let originAddressChanged = addressToUse !== results?.address
      
      // If address string is different but we have a location, we'll geocode and compare locations
      // This handles cases where address format differs but location is the same
      // Don't clear results yet - we'll check after geocoding if location is the same
      
      // Preserve existing location if address string matches (definitely hasn't changed)
      if (!originAddressChanged && results?.location) {
        searchResults.location = results.location
        searchResults.address = results.address
        originAddress = results.address ?? null
      }

      // Geocode origin address if provided and it changed
      if (addressToUse && originAddressChanged) {
        try {
          const geocodeResponse = await fetch(
            buildApiUrl('/api/geocode', { address: addressToUse })
          )
          const geocodeData = await geocodeResponse.json()
          
          if (geocodeResponse.ok) {
            // Check if this geocodes to the same location as existing results
            // If so, preserve the existing location object reference
            if (results?.location &&
                Math.abs(results.location.lat - geocodeData.location.lat) < 0.0001 &&
                Math.abs(results.location.lng - geocodeData.location.lng) < 0.0001) {
              // Same location, preserve object reference - address hasn't actually changed
              searchResults.location = results.location
              searchResults.address = results.address || geocodeData.address
              originAddress = (results.address || geocodeData.address) ?? null
              originAddressChanged = false // Mark as unchanged to preserve in setResults
            } else {
              // Different location or no previous location - address has changed
              searchResults.address = geocodeData.address
              searchResults.location = geocodeData.location
              originAddress = geocodeData.address ?? null
              originAddressChanged = true
              // Update address field with geocoded address (might be more accurate)
              setAddress(geocodeData.address)
              // Save successful address to history
              saveToHistory(geocodeData.address)
            }
            
            // Fetch transit stops if bus/train is selected
            if ((transportMode === 'bus' || transportMode === 'train') && searchResults.location) {
              fetchTransitStops(searchResults.location.lat, searchResults.location.lng, transportMode)
            }
          } else {
            // Clear location if geocoding fails
            if (searchResults.location) {
              searchResults.location = undefined
            }
            searchResults.error = geocodeData.error || 'Failed to geocode address'
          }
        } catch (error) {
          console.error('Geocoding error:', error)
          searchResults.error = 'Failed to geocode address'
        }
      } else if (addressToUse && !originAddressChanged && results?.location) {
        // Address hasn't changed, but we still need to fetch transit stops if mode changed
        if ((transportMode === 'bus' || transportMode === 'train') && results.location) {
          fetchTransitStops(results.location.lat, results.location.lng, transportMode)
        }
      }

      // Geocode destination address if provided
      if (destinationAddress) {
        try {
          const destGeocodeResponse = await fetch(
            buildApiUrl('/api/geocode', { address: destinationAddress })
          )
          const destGeocodeData = await destGeocodeResponse.json()
          
          if (destGeocodeResponse.ok) {
            destinationAddressGeocoded = destGeocodeData.address
            // Store destination location for Street View
            if (destGeocodeData.location) {
              setDestinationLocation(destGeocodeData.location)
            }
            // Save successful destination address to history
            saveDestinationToHistory(destGeocodeData.address)
          } else {
            setDestinationLocation(null)
          }
        } catch (error) {
          console.error('Destination geocoding error:', error)
        }
      }


      // Update results, preserving origin location if it hasn't changed
      setResults(prev => {
        // If origin address didn't change, preserve existing location and address completely
        if (!originAddressChanged && prev?.location) {
          // Check if there are actual changes to non-location/address fields
          // Deep compare zillowData if it exists
          let hasChanges = false
          if (searchResults.zillowData && prev.zillowData) {
            hasChanges = searchResults.zillowData.zpid !== prev.zillowData.zpid ||
                        searchResults.zillowData.url !== prev.zillowData.url
          } else if (searchResults.zillowData !== prev.zillowData) {
            hasChanges = true
          }
          
          if (searchResults.error !== prev.error) {
            hasChanges = true
          }
          
          if (!hasChanges) {
            // No changes to origin-related fields, return previous to prevent re-render
            // This is critical when only destination address changes
            return prev
          }
          
          // There are changes (like zillowData or error), but preserve location and address object references
          return { 
            ...prev, 
            ...searchResults,
            location: prev.location, // Keep same object reference - critical for preventing re-render
            address: prev.address    // Keep same string reference
          }
        }
        
        // Origin changed or no previous results
        // If we have a location in searchResults, check if it matches previous location
        if (searchResults.location && prev?.location &&
            Math.abs(searchResults.location.lat - prev.location.lat) < 0.0001 &&
            Math.abs(searchResults.location.lng - prev.location.lng) < 0.0001) {
          // Same location, preserve object reference
          return {
            ...searchResults,
            location: prev.location, // Preserve object reference
            address: prev.address || searchResults.address
          }
        }
        
        // Use new searchResults
        return searchResults
      })

      // Calculate commute if both addresses are geocoded
      if (originAddress && destinationAddressGeocoded) {
        try {
          // Check if this is a multi-leg transit journey
          if ((transportMode === 'bus' || transportMode === 'train') && selectedStop && leg1Mode) {
            console.log('Calculating multi-leg commute:', { 
              originAddress, 
              destinationAddressGeocoded, 
              transportMode,
              transitStop: selectedStop.placeId,
              leg1Mode,
              transitType: transportMode
            })
            const commuteResponse = await fetch(
              buildApiUrl('/api/commute', {
                origin: originAddress,
                destination: destinationAddressGeocoded,
                mode: 'transit',
                transitStop: selectedStop.placeId,
                leg1Mode: leg1Mode,
                transitType: transportMode
              })
            )
            const commuteData = await commuteResponse.json()
            console.log('Multi-leg commute response:', commuteData)
            
            if (commuteResponse.ok) {
              setCommuteResults(commuteData)
            } else {
              setCommuteResults({ error: commuteData.error || 'Failed to calculate commute' })
            }
          } else if (transportMode === 'bus' || transportMode === 'train') {
            // Bus/train selected but missing required info
            if (!selectedStop) {
              setCommuteResults({ error: 'Please select a transit stop' })
            } else if (!leg1Mode) {
              setCommuteResults({ error: 'Please select how to get to the transit stop (walk or drive)' })
            }
          } else {
            // Standard single-leg journey
            console.log('Calculating commute:', { originAddress, destinationAddressGeocoded, transportMode })
            const commuteResponse = await fetch(
              buildApiUrl('/api/commute', {
                origin: originAddress,
                destination: destinationAddressGeocoded,
                mode: transportMode
              })
            )
            const commuteData = await commuteResponse.json()
            console.log('Commute response:', commuteData)
            
            if (commuteResponse.ok) {
              setCommuteResults(commuteData)
            } else {
              setCommuteResults({ error: commuteData.error || 'Failed to calculate commute' })
            }
          }
        } catch (error) {
          console.error('Commute calculation error:', error)
          setCommuteResults({ error: 'Failed to calculate commute' })
        }
      } else if (destinationAddress) {
        // If destination was provided but geocoding failed
        setCommuteResults({ error: 'Could not geocode destination address for commute calculation' })
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults({ error: 'An unexpected error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ 
      padding: isMobile ? '1rem' : '2rem', 
      maxWidth: '1200px', 
      margin: '0 auto',
      color: '#000',
      backgroundColor: '#fff',
      minHeight: '100vh'
    }}>
      <h1 style={{ marginTop: 0, color: '#000', marginBottom: '1rem', fontSize: isMobile ? '1.5rem' : '2rem' }}>
        True Commute Time
      </h1>
      <p style={{ color: '#666', marginBottom: isMobile ? '1rem' : '2rem', fontSize: isMobile ? '0.875rem' : '1rem' }}>
        Search for properties and calculate commute times.
      </p>
      
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: isMobile ? '1rem' : '2rem',
        backgroundColor: '#f9f9f9',
        marginBottom: isMobile ? '1rem' : '2rem'
      }}>
        <h2 style={{ marginTop: 0, color: '#000', marginBottom: '1.5rem' }}>
          True Commute Time
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                color: '#000', 
                fontWeight: '500',
                fontSize: '1rem'
              }}>
                Zillow URL:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                <input 
                  type="url" 
                  placeholder="https://www.zillow.com/homedetails/..."
                  value={zillowUrl}
                  onChange={(e) => setZillowUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && zillowUrl && zillowUrl.trim()) {
                      e.preventDefault()
                      handleGetAddressFromZillow()
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    color: '#000',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={handleGetAddressFromZillow}
                  disabled={!zillowUrl || !zillowUrl.trim() || isLoading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: (!zillowUrl || !zillowUrl.trim() || isLoading) ? '#e0e0e0' : '#0070f3',
                    color: (!zillowUrl || !zillowUrl.trim() || isLoading) ? '#999' : '#fff',
                    cursor: (!zillowUrl || !zillowUrl.trim() || isLoading) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Get Address
                </button>
              </div>
            </div>
            <div style={{ flexShrink: 0, width: '400px' }}>
              {/* Spacer to match address field width */}
            </div>
          </div>

          {showWizardMessage && wizardWorkAddress && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#e6f2ff',
              border: '1px solid #0070f3',
              borderRadius: '4px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              color: '#004085'
            }}>
              <strong>✨ Work address prepopulated:</strong> Your work address from the Neighborhood Finder has been automatically filled in. Paste a Zillow URL below to see the true commute time!
            </div>
          )}

          <div style={{ 
            display: 'flex', 
            gap: '1.5rem', 
            alignItems: 'flex-start',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                color: '#000', 
                fontWeight: '500',
                fontSize: isMobile ? '0.875rem' : '1rem'
              }}>
                Starting Address:
              </label>
              <div style={{ 
                width: '100%', 
                boxSizing: 'border-box',
                margin: 0,
                padding: 0
              }}>
                <AddressAutocomplete
                  placeholder="Start typing an address..."
                  value={address}
                  onChange={setAddress}
                  onPlaceSelected={handlePlaceSelected}
                />
              </div>
              <AddressHistory
                addresses={addressHistory}
                onSelectAddress={handleSelectFromHistory}
                onClearHistory={clearHistory}
              />
            </div>
            {!isMobile && (
              <div style={{ flexShrink: 0 }}>
                <MapStreetViewToggle 
                  key="origin-view" 
                  location={originLocation} 
                  width={400} 
                  height={300} 
                />
              </div>
            )}
            {isMobile && originLocation && (
              <div style={{ width: '100%' }}>
                <MapStreetViewToggle 
                  key="origin-view" 
                  location={originLocation} 
                  width={isMobile ? undefined : 400} 
                  height={isMobile ? 250 : 300} 
                />
              </div>
            )}
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '1.5rem', 
            alignItems: 'flex-start',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <div style={{ flex: 1, width: '100%' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                color: '#000', 
                fontWeight: '500',
                fontSize: isMobile ? '0.875rem' : '1rem'
              }}>
                Destination Address:
              </label>
              <AddressAutocomplete
                placeholder="Enter destination address..."
                value={destinationAddress}
                onChange={setDestinationAddress}
              />
              <AddressHistory
                addresses={destinationHistory}
                onSelectAddress={handleSelectDestinationFromHistory}
                onClearHistory={clearDestinationHistory}
              />
            </div>
            {!isMobile && (
              <div style={{ flexShrink: 0 }}>
                <MapStreetViewToggle key="destination-view" location={destinationLocation} width={400} height={300} />
              </div>
            )}
            {isMobile && destinationLocation && (
              <div style={{ width: '100%' }}>
                <MapStreetViewToggle key="destination-view" location={destinationLocation} width={isMobile ? undefined : 400} height={isMobile ? 250 : 300} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                color: '#000', 
                fontWeight: '500',
                fontSize: '1rem'
              }}>
                Transportation Mode:
              </label>
              <select
                value={transportMode}
                onChange={(e) => {
                  const newMode = e.target.value as 'driving' | 'bus' | 'train' | 'walking' | 'bicycling'
                  setTransportMode(newMode)
                  setCommuteResults(null) // Clear previous commute results
                  
                  // Reset transit-related state when switching modes
                  if (newMode === 'bus' || newMode === 'train') {
                    setTransitType(newMode)
                    // Fetch stops if we have location
                    if (results?.location) {
                      fetchTransitStops(results.location.lat, results.location.lng, newMode)
                    }
                  } else {
                    setTransitType(null)
                    setTransitStops([])
                    setSelectedStop(null)
                    setLeg1Mode(null)
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  color: '#000',
                  backgroundColor: '#fff',
                  boxSizing: 'border-box'
                }}
              >
                <option value="driving">🚗 Driving</option>
                <option value="bus">🚌 Bus</option>
                <option value="train">🚂 Train</option>
                <option value="walking">🚶 Walking</option>
                <option value="bicycling">🚴 Bicycling</option>
              </select>
            </div>
            <div style={{ flexShrink: 0, width: '400px' }}>
              {/* Spacer to match address field width */}
            </div>
          </div>

          {/* Transit Stop Selection - shown when bus/train is selected */}
          {(transportMode === 'bus' || transportMode === 'train') && results?.location && (
            <>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    color: '#000', 
                    fontWeight: '500',
                    fontSize: '1rem'
                  }}>
                    Nearest {transportMode === 'bus' ? 'Bus' : 'Train'} Stops:
                  </label>
                  {isLoadingStops ? (
                    <div style={{ padding: '1rem', color: '#666' }}>Loading stops...</div>
                  ) : transitStops.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {transitStops.map((stop, index) => (
                        <label
                          key={stop.placeId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.75rem',
                            border: selectedStop?.placeId === stop.placeId ? '2px solid #0070f3' : '1px solid #ccc',
                            borderRadius: '4px',
                            backgroundColor: selectedStop?.placeId === stop.placeId ? '#e6f2ff' : '#fff',
                            cursor: 'pointer',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                        >
                          <input
                            type="radio"
                            name="transitStop"
                            value={stop.placeId}
                            checked={selectedStop?.placeId === stop.placeId}
                            onChange={() => {
                              setSelectedStop(stop)
                              setLeg1Mode('driving') // Default to driving when stop is selected
                            }}
                            style={{ marginRight: '0.75rem' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                              {stop.name}
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
                  ) : (
                    <div style={{ padding: '1rem', color: '#666', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                      No {transportMode === 'bus' ? 'bus' : 'train'} stops found nearby. Try a different address.
                    </div>
                  )}
                </div>
                <div style={{ flexShrink: 0 }}>
                  <MapStreetViewToggle 
                    key="transit-stop-view" 
                    location={selectedStop ? selectedStop.location : null} 
                    width={400} 
                    height={300} 
                  />
                </div>
              </div>

              {/* Leg 1 Mode Selector - shown when a stop is selected */}
              {selectedStop && (
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      color: '#000', 
                      fontWeight: '500',
                      fontSize: '1rem'
                    }}>
                      How to get to stop?
                    </label>
                    <select
                      value={leg1Mode || 'driving'}
                      onChange={(e) => setLeg1Mode(e.target.value as 'walking' | 'driving')}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        fontSize: '1rem',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        color: '#000',
                        backgroundColor: '#fff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="walking">🚶 Walk</option>
                      <option value="driving">🚗 Drive</option>
                    </select>
                  </div>
                  <div style={{ flexShrink: 0, width: '400px' }}>
                    {/* Spacer to match address field width */}
                  </div>
                </div>
              )}
            </>
          )}

          <button 
            type="submit"
            disabled={isLoading || !address || !destinationAddress}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: (isLoading || !address || !destinationAddress) ? '#ccc' : '#0070f3',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: (isLoading || !address || !destinationAddress) ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              alignSelf: 'flex-start'
            }}
          >
            {isLoading ? 'Searching...' : 'Search Properties'}
          </button>
        </form>
      </div>

      {(commuteResults || (destinationAddress && results)) && (
        <div 
          id="results-section"
          ref={resultsRef}
          style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '2rem',
            backgroundColor: commuteResults?.error ? '#fee' : '#eef',
            marginTop: '2rem'
          }}>
          <h2 style={{ marginTop: 0, color: '#000', marginBottom: '1rem' }}>
            Commute Information
          </h2>
          
          {commuteResults?.error && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#fcc', 
              borderRadius: '4px',
              color: '#c00',
              marginBottom: '1rem'
            }}>
              <strong>Error:</strong> {commuteResults.error}
            </div>
          )}

          {!commuteResults && destinationAddress && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#ffc', 
              borderRadius: '4px',
              color: '#660',
              marginBottom: '1rem'
            }}>
              <strong>Note:</strong> Enter a destination address and click search to calculate commute time.
            </div>
          )}

          {/* Multi-leg transit results */}
          {commuteResults?.leg1 && commuteResults?.leg2 && commuteResults?.total && (
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #ddd' }}>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Leg 1: {leg1Mode === 'walking' ? '🚶 Walking' : '🚗 Driving'} to {transitType === 'bus' ? 'Bus' : 'Train'} Stop
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    {commuteResults.leg1.duration} ({commuteResults.leg1.distance})
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #ddd' }}>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Leg 2: {transitType === 'bus' ? '🚌 Bus' : '🚂 Train'} to Destination
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    {commuteResults.leg2.duration} ({commuteResults.leg2.distance})
                  </div>
                </div>

                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#e6f2ff', borderRadius: '4px', border: '2px solid #0070f3' }}>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Total Journey
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem', color: '#0070f3' }}>
                    {commuteResults.total.duration}
                  </div>
                  <div style={{ fontSize: '1rem', color: '#666' }}>
                    {commuteResults.total.distance}
                  </div>
                </div>
              </div>

              {/* Commute Route Map */}
              {results?.location && destinationLocation && selectedStop && leg1Mode && transitType && (
                <div style={{ flexShrink: 0 }}>
                  <CommuteMap
                    origin={results.location}
                    transitStop={{
                      lat: selectedStop.location.lat,
                      lng: selectedStop.location.lng,
                      name: selectedStop.name,
                    }}
                    destination={destinationLocation}
                    leg1Mode={leg1Mode}
                    transitType={transitType}
                    width={400}
                    height={300}
                  />
                </div>
              )}
            </div>
          )}

          {/* Single-leg results (non-transit or old format) */}
          {commuteResults?.duration && !commuteResults?.leg1 && (
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #ddd' }}>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem', fontWeight: '500' }}>
                    {commuteResults.mode === 'transit' ? '🚌 Bus / Train' :
                     commuteResults.mode === 'walking' ? '🚶 Walking' :
                     commuteResults.mode === 'bicycling' ? '🚴 Bicycling' :
                     '🚗 Driving'} to Destination
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    {commuteResults.duration} {commuteResults.distance && `(${commuteResults.distance})`}
                  </div>
                </div>

                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#e6f2ff', borderRadius: '4px', border: '2px solid #0070f3' }}>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Total Journey
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem', color: '#0070f3' }}>
                    {commuteResults.duration}
                  </div>
                  {commuteResults.distance && (
                    <div style={{ fontSize: '1rem', color: '#666' }}>
                      {commuteResults.distance}
                    </div>
                  )}
                </div>
              </div>

              {/* Commute Route Map for single-leg journeys */}
              {results?.location && destinationLocation && (
                <div style={{ flexShrink: 0 }}>
                  <CommuteMap
                    origin={results.location}
                    destination={destinationLocation}
                    mode={commuteResults.mode === 'transit' ? 'transit' : 
                          commuteResults.mode === 'walking' ? 'walking' :
                          commuteResults.mode === 'bicycling' ? 'bicycling' : 'driving'}
                    width={400}
                    height={300}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
