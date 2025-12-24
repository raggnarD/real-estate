'use client'

import { useState, useEffect, useMemo } from 'react'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import AddressHistory from '@/components/AddressHistory'
import MapStreetViewToggle from '@/components/MapStreetViewToggle'

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

  // Memoize origin location to prevent unnecessary re-renders
  const originLocation = useMemo(() => results?.location || null, [
    results?.location?.lat, 
    results?.location?.lng
  ])

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

  // Select address from history
  const handleSelectFromHistory = async (addr: string) => {
    setAddress(addr)
    // Geocode immediately to show Street View
    try {
      const geocodeResponse = await fetch(
        `/api/geocode?address=${encodeURIComponent(addr)}`
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
        `/api/geocode?address=${encodeURIComponent(addr)}`
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
      const location = {
        lat: typeof place.geometry.location.lat === 'function' 
          ? place.geometry.location.lat() 
          : place.geometry.location.lat,
        lng: typeof place.geometry.location.lng === 'function'
          ? place.geometry.location.lng()
          : place.geometry.location.lng
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
        `/api/transit-stops?lat=${lat}&lng=${lng}&type=${type}`
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setCommuteResults(null)

    try {
      const searchResults: SearchResults = {}
      let originAddress: string | null = null
      let destinationAddressGeocoded: string | null = null

      // Preserve existing results if origin address hasn't changed
      const originAddressChanged = address !== results?.address
      
      // Only clear results if origin address changed
      if (originAddressChanged) {
        setResults(null)
      } else {
        // Preserve existing location if address hasn't changed
        if (results?.location) {
          searchResults.location = results.location
          searchResults.address = results.address
          originAddress = results.address
        }
      }

      // Geocode origin address if provided and it changed
      if (address && originAddressChanged) {
        try {
          const geocodeResponse = await fetch(
            `/api/geocode?address=${encodeURIComponent(address)}`
          )
          const geocodeData = await geocodeResponse.json()
          
          if (geocodeResponse.ok) {
            searchResults.address = geocodeData.address
            searchResults.location = geocodeData.location
            originAddress = geocodeData.address
            // Save successful address to history
            saveToHistory(geocodeData.address)
            
            // Fetch transit stops if bus/train is selected
            if ((transportMode === 'bus' || transportMode === 'train') && geocodeData.location) {
              fetchTransitStops(geocodeData.location.lat, geocodeData.location.lng, transportMode)
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
      } else if (address && !originAddressChanged && results?.location) {
        // Address hasn't changed, but we still need to fetch transit stops if mode changed
        if ((transportMode === 'bus' || transportMode === 'train') && results.location) {
          fetchTransitStops(results.location.lat, results.location.lng, transportMode)
        }
      }

      // Geocode destination address if provided
      if (destinationAddress) {
        try {
          const destGeocodeResponse = await fetch(
            `/api/geocode?address=${encodeURIComponent(destinationAddress)}`
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

      // Process Zillow URL if provided
      if (zillowUrl) {
        try {
          const zillowResponse = await fetch(
            `/api/zillow?url=${encodeURIComponent(zillowUrl)}`
          )
          const zillowData = await zillowResponse.json()
          
          if (zillowResponse.ok) {
            searchResults.zillowData = zillowData
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

      // Update results, preserving origin location if it hasn't changed
      setResults(prev => {
        // If origin address didn't change, preserve existing location and address completely
        if (!originAddressChanged && prev?.location) {
          // Only update if there are actual changes (like zillowData)
          const hasChanges = Object.keys(searchResults).some(key => 
            key !== 'location' && key !== 'address' && searchResults[key as keyof SearchResults] !== prev[key as keyof SearchResults]
          )
          if (!hasChanges) {
            // No changes, return previous to prevent re-render
            return prev
          }
          return { 
            ...prev, 
            ...searchResults,
            location: prev.location, // Keep same object reference
            address: prev.address 
          }
        }
        // Origin changed or no previous results - use new searchResults
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
              `/api/commute?origin=${encodeURIComponent(originAddress)}&destination=${encodeURIComponent(destinationAddressGeocoded)}&mode=transit&transitStop=${encodeURIComponent(selectedStop.placeId)}&leg1Mode=${leg1Mode}&transitType=${transportMode}`
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
              `/api/commute?origin=${encodeURIComponent(originAddress)}&destination=${encodeURIComponent(destinationAddressGeocoded)}&mode=${transportMode}`
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
      padding: '2rem', 
      maxWidth: '1200px', 
      margin: '0 auto',
      color: '#000',
      backgroundColor: '#fff',
      minHeight: '100vh'
    }}>
      <h1 style={{ 
        fontSize: '2.5rem', 
        fontWeight: 'bold', 
        marginBottom: '1rem',
        color: '#000'
      }}>
        Real Estate App
      </h1>
      <p style={{ 
        fontSize: '1.125rem', 
        color: '#333',
        marginBottom: '2rem'
      }}>
        Search for properties and calculate commute times.
      </p>
      
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '2rem',
        backgroundColor: '#f9f9f9',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginTop: 0, color: '#000', marginBottom: '1.5rem' }}>
          Property Search
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: '#000', 
              fontWeight: '500',
              fontSize: '1rem'
            }}>
              Zillow URL:
            </label>
            <input 
              type="url" 
              placeholder="https://www.zillow.com/homedetails/..."
              value={zillowUrl}
              onChange={(e) => setZillowUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                color: '#000',
                backgroundColor: '#fff'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                color: '#000', 
                fontWeight: '500',
                fontSize: '1rem'
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
            <div style={{ flexShrink: 0 }}>
              <MapStreetViewToggle 
                key="origin-view" 
                location={originLocation} 
                width={400} 
                height={300} 
              />
            </div>
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
            <div style={{ flexShrink: 0 }}>
              <MapStreetViewToggle key="destination-view" location={destinationLocation} width={400} height={300} />
            </div>
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
              <div>
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
                          cursor: 'pointer'
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

              {/* Leg 1 Mode Selector - shown when a stop is selected */}
              {selectedStop && (
                <div>
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
                      backgroundColor: '#fff'
                    }}
                  >
                    <option value="walking">🚶 Walk</option>
                    <option value="driving">🚗 Drive</option>
                  </select>
                </div>
              )}
            </>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: isLoading ? '#ccc' : '#0070f3',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              alignSelf: 'flex-start'
            }}
          >
            {isLoading ? 'Searching...' : 'Search Properties'}
          </button>
        </form>
      </div>

      {results && (
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          padding: '2rem',
          backgroundColor: results.error ? '#fee' : '#efe'
        }}>
          <h2 style={{ marginTop: 0, color: '#000', marginBottom: '1rem' }}>
            Search Results
          </h2>
          
          {results.error && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#fcc', 
              borderRadius: '4px',
              color: '#c00',
              marginBottom: '1rem'
            }}>
              <strong>Error:</strong> {results.error}
            </div>
          )}

          {results.address && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Address:</strong> {results.address}
            </div>
          )}

          {results.location && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Location:</strong> {results.location.lat.toFixed(6)}, {results.location.lng.toFixed(6)}
            </div>
          )}

          {results.zillowData && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Zillow ZPID:</strong> {results.zillowData.zpid}
              <br />
              <strong>URL:</strong> <a href={results.zillowData.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0070f3' }}>
                {results.zillowData.url}
              </a>
            </div>
          )}
        </div>
      )}

      {(commuteResults || (destinationAddress && results)) && (
        <div style={{ 
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
            <>
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
            </>
          )}

          {/* Single-leg results (non-transit or old format) */}
          {commuteResults?.duration && !commuteResults?.leg1 && (
            <div style={{ marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
              <strong>Travel Time:</strong> {commuteResults.duration}
            </div>
          )}

          {commuteResults?.distance && !commuteResults?.leg1 && (
            <div style={{ marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
              <strong>Distance:</strong> {commuteResults.distance}
            </div>
          )}

          {commuteResults?.mode && !commuteResults?.leg1 && (
            <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
              <strong>Transportation Mode:</strong> {
                commuteResults.mode === 'transit' ? '🚌 Bus / Train' :
                commuteResults.mode === 'walking' ? '🚶 Walking' :
                commuteResults.mode === 'bicycling' ? '🚴 Bicycling' :
                '🚗 Driving'
              }
            </div>
          )}
        </div>
      )}
    </div>
  )
}
