'use client'

import { useState, useEffect } from 'react'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import AddressHistory from '@/components/AddressHistory'
import NeighborhoodResults from '@/components/NeighborhoodResults'
import NeighborhoodMap from '@/components/NeighborhoodMap'

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

const WORK_ADDRESS_HISTORY_KEY = 'neighborhood-finder-work-address-history'
const MAX_HISTORY_ITEMS = 3

export default function NeighborhoodFinder() {
  const [workAddress, setWorkAddress] = useState('')
  const [workLocation, setWorkLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [transportMode, setTransportMode] = useState<'driving' | 'bus' | 'train' | 'walking' | 'bicycling'>('driving')
  const [maxCommuteTime, setMaxCommuteTime] = useState<number>(60)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<CityResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [addressHistory, setAddressHistory] = useState<string[]>([])
  const [selectedCityId, setSelectedCityId] = useState<string | undefined>(undefined)
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'both'>('both')

  // Load address history from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(WORK_ADDRESS_HISTORY_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setAddressHistory(Array.isArray(parsed) ? parsed : [])
        } catch (error) {
          console.error('Error loading address history:', error)
        }
      }
    }
  }, [])

  // Save address to history
  const saveToHistory = (addr: string) => {
    if (!addr || addr.trim() === '') return

    setAddressHistory((prev) => {
      const filtered = prev.filter((a) => a.toLowerCase() !== addr.toLowerCase())
      const updated = [addr, ...filtered].slice(0, MAX_HISTORY_ITEMS)
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(WORK_ADDRESS_HISTORY_KEY, JSON.stringify(updated))
      }
      
      return updated
    })
  }

  // Clear history
  const clearHistory = () => {
    setAddressHistory([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem(WORK_ADDRESS_HISTORY_KEY)
    }
  }

  // Select address from history
  const handleSelectFromHistory = async (addr: string) => {
    setWorkAddress(addr)
    try {
      const geocodeResponse = await fetch(
        `/api/geocode?address=${encodeURIComponent(addr)}`
      )
      const geocodeData = await geocodeResponse.json()
      
      if (geocodeResponse.ok && geocodeData.location) {
        setWorkLocation(geocodeData.location)
      }
    } catch (error) {
      console.error('Geocoding error:', error)
    }
  }

  // Handle place selected from autocomplete
  const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
    if (place.formatted_address) {
      setWorkAddress(place.formatted_address)
      saveToHistory(place.formatted_address)
    }
    
    if (place.geometry?.location) {
      const location = {
        lat: typeof place.geometry.location.lat === 'function' 
          ? place.geometry.location.lat() 
          : place.geometry.location.lat,
        lng: typeof place.geometry.location.lng === 'function'
          ? place.geometry.location.lng()
          : place.geometry.location.lng
      }
      setWorkLocation(location)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setResults([])

    if (!workLocation) {
      // Try to geocode the address first
      if (!workAddress) {
        setError('Please enter a work address')
        setIsLoading(false)
        return
      }

      try {
        const geocodeResponse = await fetch(
          `/api/geocode?address=${encodeURIComponent(workAddress)}`
        )
        const geocodeData = await geocodeResponse.json()
        
        if (geocodeResponse.ok && geocodeData.location) {
          setWorkLocation(geocodeData.location)
          saveToHistory(geocodeData.address)
          // Continue with search using the geocoded location
        } else {
          setError('Could not find location for work address')
          setIsLoading(false)
          return
        }
      } catch (error) {
        console.error('Geocoding error:', error)
        setError('Failed to geocode work address')
        setIsLoading(false)
        return
      }
    }

    try {
      const response = await fetch(
        `/api/neighborhood-finder?lat=${workLocation!.lat}&lng=${workLocation!.lng}&mode=${transportMode}&maxTime=${maxCommuteTime}`
      )
      const data = await response.json()

      if (response.ok) {
        setResults(data.cities || [])
        if (data.cities && data.cities.length === 0) {
          setError('No cities found within the specified commute time. Try increasing the maximum commute time.')
        }
      } else {
        setError(data.error || 'Failed to find neighborhoods')
      }
    } catch (error) {
      console.error('Neighborhood finder error:', error)
      setError('An error occurred while searching for neighborhoods')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '2rem'
    }}>
      <h1 style={{ marginTop: 0, color: '#000', marginBottom: '1rem' }}>
        Neighborhood Finder
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Find cities and towns within your maximum commute time from work.
      </p>

      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '2rem',
        backgroundColor: '#f9f9f9',
        marginBottom: '2rem'
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                color: '#000', 
                fontWeight: '500',
                fontSize: '1rem'
              }}>
                Work Address:
              </label>
              <div style={{ 
                width: '100%', 
                boxSizing: 'border-box',
                margin: 0,
                padding: 0
              }}>
                <AddressAutocomplete
                  placeholder="Enter your work address..."
                  value={workAddress}
                  onChange={setWorkAddress}
                  onPlaceSelected={handlePlaceSelected}
                />
              </div>
              <AddressHistory
                addresses={addressHistory}
                onSelectAddress={handleSelectFromHistory}
                onClearHistory={clearHistory}
              />
            </div>
            <div style={{ flexShrink: 0, width: '400px' }}>
              {/* Spacer to match address field width */}
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
                  setTransportMode(e.target.value as 'driving' | 'bus' | 'train' | 'walking' | 'bicycling')
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

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                color: '#000', 
                fontWeight: '500',
                fontSize: '1rem'
              }}>
                Maximum Commute Time (minutes):
              </label>
              <input
                type="number"
                min="1"
                max="180"
                value={maxCommuteTime}
                onChange={(e) => setMaxCommuteTime(parseInt(e.target.value, 10) || 60)}
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
              />
            </div>
            <div style={{ flexShrink: 0, width: '400px' }}>
              {/* Spacer to match address field width */}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !workAddress}
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              backgroundColor: (isLoading || !workAddress) ? '#ccc' : '#0070f3',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: (isLoading || !workAddress) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              alignSelf: 'flex-start'
            }}
          >
            {isLoading ? 'Searching...' : 'Find Neighborhoods'}
          </button>
        </form>
      </div>

      {error && (
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          padding: '2rem',
          backgroundColor: '#fee',
          marginBottom: '2rem'
        }}>
          <div style={{ color: '#c00', fontWeight: '600' }}>Error: {error}</div>
        </div>
      )}

      {results.length > 0 && (
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          padding: '2rem',
          backgroundColor: '#f9f9f9'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, color: '#000' }}>
              Found {results.length} {results.length === 1 ? 'City' : 'Cities'} within {maxCommuteTime} minutes
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  backgroundColor: viewMode === 'list' ? '#0070f3' : '#fff',
                  color: viewMode === 'list' ? '#fff' : '#333',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: viewMode === 'list' ? '600' : '400',
                }}
              >
                List
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
                }}
              >
                Map
              </button>
              <button
                onClick={() => setViewMode('both')}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  backgroundColor: viewMode === 'both' ? '#0070f3' : '#fff',
                  color: viewMode === 'both' ? '#fff' : '#333',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: viewMode === 'both' ? '600' : '400',
                }}
              >
                Both
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
            {(viewMode === 'list' || viewMode === 'both') && (
              <div style={{ flex: 1 }}>
                <NeighborhoodResults
                  cities={results}
                  onCityClick={(city) => setSelectedCityId(city.placeId)}
                  selectedCityId={selectedCityId}
                />
              </div>
            )}
            {(viewMode === 'map' || viewMode === 'both') && workLocation && (
              <div style={{ flexShrink: 0 }}>
                <NeighborhoodMap
                  workLocation={workLocation}
                  cities={results}
                  selectedCityId={selectedCityId}
                  onCitySelect={(city) => setSelectedCityId(city.placeId)}
                  width={400}
                  height={600}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

