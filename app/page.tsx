'use client'

import { useState, useEffect } from 'react'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import AddressHistory from '@/components/AddressHistory'

interface SearchResults {
  address?: string
  location?: { lat: number; lng: number }
  zillowData?: { zpid: string; url: string }
  error?: string
}

interface CommuteResults {
  distance?: string
  duration?: string
  mode?: string
  error?: string
}

const ADDRESS_HISTORY_KEY = 'real-estate-address-history'
const MAX_HISTORY_ITEMS = 10

export default function Home() {
  const [address, setAddress] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [zillowUrl, setZillowUrl] = useState('')
  const [transportMode, setTransportMode] = useState<'driving' | 'transit' | 'walking' | 'bicycling'>('driving')
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [addressHistory, setAddressHistory] = useState<string[]>([])
  const [commuteResults, setCommuteResults] = useState<{
    distance?: string
    duration?: string
    mode?: string
    error?: string
  } | null>(null)

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

  // Select address from history
  const handleSelectFromHistory = (addr: string) => {
    setAddress(addr)
  }

  const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
    setSelectedPlace(place)
    if (place.formatted_address) {
      setAddress(place.formatted_address)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResults(null)
    setCommuteResults(null)

    try {
      const searchResults: SearchResults = {}
      let originAddress: string | null = null
      let destinationAddressGeocoded: string | null = null

      // Geocode origin address if provided
      if (address) {
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
          } else {
            searchResults.error = geocodeData.error || 'Failed to geocode address'
          }
        } catch (error) {
          console.error('Geocoding error:', error)
          searchResults.error = 'Failed to geocode address'
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

      setResults(searchResults)

      // Calculate commute if both addresses are geocoded
      if (originAddress && destinationAddressGeocoded) {
        try {
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
              Address (with autocomplete):
            </label>
            <AddressAutocomplete
              placeholder="Start typing an address..."
              value={address}
              onChange={setAddress}
              onPlaceSelected={handlePlaceSelected}
            />
            <AddressHistory
              addresses={addressHistory}
              onSelectAddress={handleSelectFromHistory}
              onClearHistory={clearHistory}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: '#000', 
              fontWeight: '500',
              fontSize: '1rem'
            }}>
              Destination Address (for commute):
            </label>
            <AddressAutocomplete
              placeholder="Enter destination address..."
              value={destinationAddress}
              onChange={setDestinationAddress}
            />
          </div>

          <div>
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
              onChange={(e) => setTransportMode(e.target.value as 'driving' | 'transit' | 'walking' | 'bicycling')}
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
              <option value="driving">🚗 Driving</option>
              <option value="transit">🚌 Bus / Train (Transit)</option>
              <option value="walking">🚶 Walking</option>
              <option value="bicycling">🚴 Bicycling</option>
            </select>
          </div>

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

          {commuteResults?.duration && (
            <div style={{ marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
              <strong>Travel Time:</strong> {commuteResults.duration}
            </div>
          )}

          {commuteResults?.distance && (
            <div style={{ marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
              <strong>Distance:</strong> {commuteResults.distance}
            </div>
          )}

          {commuteResults?.mode && (
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
