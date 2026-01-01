'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import AddressHistory from '@/components/AddressHistory'
import MapStreetViewToggle from '@/components/MapStreetViewToggle'
import CommuteMap from '@/components/CommuteMap'
import TransitStopDirectionsMap from '@/components/TransitStopDirectionsMap'
import TransitStopsModal from '@/components/TransitStopsModal'
import { useScrollToResults } from '@/hooks/useScrollToResults'
import { useApiKey } from '@/contexts/ApiKeyContext'
import { useWizard } from '@/contexts/WizardContext'
import { safeTrackedFetch } from '@/utils/safeTrackedFetch'

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
  type?: string // 'Bus', 'Train', or 'Subway'
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

// Helper function to get tomorrow at 9:00am in datetime-local format
const getDefaultArrivalTime = (): string => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)
  
  // Format as YYYY-MM-DDTHH:mm for datetime-local input
  const year = tomorrow.getFullYear()
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
  const day = String(tomorrow.getDate()).padStart(2, '0')
  const hours = String(tomorrow.getHours()).padStart(2, '0')
  const minutes = String(tomorrow.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export default function Home() {
  const { apiKey } = useApiKey()
  const { wizardActive, workAddress: wizardWorkAddress, setWizardStep } = useWizard()
  const [isMobile, setIsMobile] = useState(false)
  const [address, setAddress] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [zillowUrl, setZillowUrl] = useState('')
  const [transportMode, setTransportMode] = useState<'driving' | 'bus' | 'train' | 'walking' | 'bicycling'>('driving')
  const [transitType, setTransitType] = useState<'bus' | 'train' | null>(null)
  const [includeSubway, setIncludeSubway] = useState(false)
  const [transitStops, setTransitStops] = useState<TransitStop[]>([])
  const [selectedStop, setSelectedStop] = useState<TransitStop | null>(null)
  const [hasMoreStops, setHasMoreStops] = useState(false)
  const [transitStopsOffset, setTransitStopsOffset] = useState(0)
  const [showTransitStopsModal, setShowTransitStopsModal] = useState(false)
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
  const [arrivalTime, setArrivalTime] = useState<string>(getDefaultArrivalTime())

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

  // Prepopulate destination address from wizard if active
  useEffect(() => {
    if (wizardActive && wizardWorkAddress && !destinationAddress) {
      setDestinationAddress(wizardWorkAddress)
      setWizardStep('commute-time')
      setShowWizardMessage(true)
      // Hide message after 5 seconds
      setTimeout(() => {
        setShowWizardMessage(false)
      }, 5000)
    }
  }, [wizardActive, wizardWorkAddress, destinationAddress, setWizardStep])


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
  const buildApiUrl = useCallback((baseUrl: string, params: Record<string, string>) => {
    const url = new URL(baseUrl, window.location.origin)
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
    if (apiKey) {
      url.searchParams.append('apiKey', apiKey)
    }
    return url.toString()
  }, [apiKey])

  // Geocode destination address when it's set from wizard
  useEffect(() => {
    if (wizardActive && wizardWorkAddress && destinationAddress === wizardWorkAddress && !destinationLocation && apiKey) {
      // Geocode the destination address to load the map
      const geocodeDestination = async () => {
        try {
          const geocodeResponse = await safeTrackedFetch(
            buildApiUrl('/api/geocode', { address: wizardWorkAddress }),
          )
          const geocodeData = await geocodeResponse.json()
          
          if (geocodeResponse.ok && geocodeData.location) {
            setDestinationLocation(geocodeData.location)
            // Save to history
            saveDestinationToHistory(geocodeData.address || wizardWorkAddress)
          } else {
            console.error('Failed to geocode destination:', geocodeData.error)
            setDestinationLocation(null)
          }
        } catch (error) {
          console.error('Destination geocoding error:', error)
          setDestinationLocation(null)
        }
      }
      
      // Small delay to ensure buildApiUrl is available
      setTimeout(() => {
        geocodeDestination()
      }, 100)
    }
  }, [wizardActive, wizardWorkAddress, destinationAddress, destinationLocation, apiKey, buildApiUrl, saveDestinationToHistory])

  // Select address from history
  const handleSelectFromHistory = async (addr: string) => {
    setAddress(addr)
    // Geocode immediately to show Street View
    try {
      const geocodeResponse = await safeTrackedFetch(
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
          fetchTransitStops(geocodeData.location.lat, geocodeData.location.lng, transportMode, 0, 3, includeSubway)
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
      const geocodeResponse = await safeTrackedFetch(
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
          fetchTransitStops(location.lat, location.lng, transportMode, 0, 3, includeSubway)
        }
      }
    }
    // Reset transit-related state when address changes
    setTransitStops([])
    setSelectedStop(null)
    setLeg1Mode(null)
    setHasMoreStops(false)
    setTransitStopsOffset(0)
  }

  // Fetch transit stops when address is geocoded and bus/train is selected
  const fetchTransitStops = async (lat: number, lng: number, type: 'bus' | 'train', offset: number = 0, limit: number = 3, includeSubwayStops: boolean = false) => {
    setIsLoadingStops(true)
    try {
      const params: Record<string, string> = {
        lat: lat.toString(), 
        lng: lng.toString(), 
        type,
        offset: offset.toString(),
        limit: limit.toString()
      }
      // Only add includeSubway parameter for train mode
      if (type === 'train') {
        params.includeSubway = includeSubwayStops.toString()
      }
      
      const response = await safeTrackedFetch(
        buildApiUrl('/api/transit-stops', params)
      )
      const data = await response.json()
      
      if (response.ok && data.stops) {
        setTransitStops(data.stops)
        // Auto-select first stop only if no stop is currently selected
        if (data.stops.length > 0 && offset === 0 && !selectedStop) {
          setSelectedStop(data.stops[0])
          setLeg1Mode('driving') // Default to driving
        }
        setHasMoreStops(data.hasMore || false)
        setTransitStopsOffset(offset)
        return { stops: data.stops, hasMore: data.hasMore || false }
      } else {
        setTransitStops([])
        if (offset === 0) {
          setSelectedStop(null)
        }
        setHasMoreStops(false)
        return { stops: [], hasMore: false }
      }
    } catch (error) {
      console.error('Error fetching transit stops:', error)
      setTransitStops([])
      if (offset === 0) {
        setSelectedStop(null)
      }
      setHasMoreStops(false)
      return { stops: [], hasMore: false }
    } finally {
      setIsLoadingStops(false)
    }
  }

  // Fetch stops for modal (10 at a time) - without auto-selecting
  const fetchStopsForModal = async (offset: number) => {
    if (!results?.location || (transportMode !== 'bus' && transportMode !== 'train')) {
      return { stops: [], hasMore: false }
    }
    setIsLoadingStops(true)
    try {
      const params: Record<string, string> = {
        lat: results.location.lat.toString(), 
        lng: results.location.lng.toString(), 
        type: transportMode,
        offset: offset.toString(),
        limit: '10'
      }
      // Only add includeSubway parameter for train mode
      if (transportMode === 'train') {
        params.includeSubway = includeSubway.toString()
      }
      
      const response = await safeTrackedFetch(
        buildApiUrl('/api/transit-stops', params)
      )
      const data = await response.json()
      
      if (response.ok && data.stops) {
        // Don't auto-select or update transitStops state - just return the data
        setHasMoreStops(data.hasMore || false)
        return { stops: data.stops, hasMore: data.hasMore || false }
      } else {
        setHasMoreStops(false)
        return { stops: [], hasMore: false }
      }
    } catch (error) {
      console.error('Error fetching transit stops for modal:', error)
      setHasMoreStops(false)
      return { stops: [], hasMore: false }
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
        const geocodeResponse = await safeTrackedFetch(
          buildApiUrl('/api/geocode', { address: zillowData.address }),
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
            fetchTransitStops(geocodeData.location.lat, geocodeData.location.lng, transportMode, 0, 3, includeSubway)
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
          const zillowResponse = await safeTrackedFetch(
            `/api/zillow?url=${encodeURIComponent(zillowUrl)}`,
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
          const geocodeResponse = await safeTrackedFetch(
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
              fetchTransitStops(searchResults.location.lat, searchResults.location.lng, transportMode, 0, 3, includeSubway)
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
          fetchTransitStops(results.location.lat, results.location.lng, transportMode, 0, 3, includeSubway)
        }
      }

      // Geocode destination address if provided
      if (destinationAddress) {
        try {
          const destGeocodeResponse = await safeTrackedFetch(
            buildApiUrl('/api/geocode', { address: destinationAddress }),
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
          // Convert arrival time to Unix timestamp (seconds since epoch) if provided
          let arrivalTimeParam: string | undefined = undefined
          if (arrivalTime) {
            const arrivalDate = new Date(arrivalTime)
            if (!isNaN(arrivalDate.getTime())) {
              arrivalTimeParam = Math.floor(arrivalDate.getTime() / 1000).toString()
            }
          }

          // Check if this is a multi-leg transit journey
          if ((transportMode === 'bus' || transportMode === 'train') && selectedStop && leg1Mode) {
            console.log('Calculating multi-leg commute:', { 
              originAddress, 
              destinationAddressGeocoded, 
              transportMode,
              transitStop: selectedStop.placeId,
              selectedStopName: selectedStop.name,
              selectedStopAddress: selectedStop.address,
              selectedStopLocation: selectedStop.location,
              leg1Mode,
              transitType: transportMode,
              allTransitStops: transitStops.map(s => ({ name: s.name, placeId: s.placeId })),
              arrivalTime: arrivalTimeParam
            })
            const commuteParams: Record<string, string> = {
              origin: originAddress,
              destination: destinationAddressGeocoded,
              mode: 'transit',
              transitStop: selectedStop.placeId,
              leg1Mode: leg1Mode,
              transitType: transportMode
            }
            if (arrivalTimeParam) {
              commuteParams.arrivalTime = arrivalTimeParam
            }
            const commuteResponse = await safeTrackedFetch(
              buildApiUrl('/api/commute', commuteParams),
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
            console.log('Calculating commute:', { originAddress, destinationAddressGeocoded, transportMode, arrivalTime: arrivalTimeParam })
            const commuteParams: Record<string, string> = {
              origin: originAddress,
              destination: destinationAddressGeocoded,
              mode: transportMode
            }
            if (arrivalTimeParam) {
              commuteParams.arrivalTime = arrivalTimeParam
            }
            const commuteResponse = await safeTrackedFetch(
              buildApiUrl('/api/commute', commuteParams),
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
      width: '100%',
      margin: '0 auto',
      color: '#000',
      backgroundColor: '#fff',
      minHeight: '100vh',
      boxSizing: 'border-box'
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
        marginBottom: isMobile ? '1rem' : '2rem',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        <h2 style={{ marginTop: 0, color: '#000', marginBottom: '1.5rem' }}>
          True Commute Time
        </h2>
        <form onSubmit={handleSubmit} style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isMobile ? '1.25rem' : '1.5rem',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Zillow URL Section */}
          <div style={{ 
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: '#000', 
              fontWeight: '500',
              fontSize: isMobile ? '0.875rem' : '1rem'
            }}>
              Zillow URL:
            </label>
            <div style={{ 
              display: 'flex', 
              gap: isMobile ? '0.75rem' : '0.5rem', 
              alignItems: 'stretch',
              flexDirection: isMobile ? 'column' : 'row',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}>
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
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  padding: isMobile ? '0.875rem' : '0.75rem',
                  fontSize: isMobile ? '0.9375rem' : '1rem',
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
                  padding: isMobile ? '0.875rem 1.25rem' : '0.75rem 1.5rem',
                  fontSize: isMobile ? '0.9375rem' : '1rem',
                  fontWeight: '500',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: (!zillowUrl || !zillowUrl.trim() || isLoading) ? '#e0e0e0' : '#0070f3',
                  color: (!zillowUrl || !zillowUrl.trim() || isLoading) ? '#999' : '#fff',
                  cursor: (!zillowUrl || !zillowUrl.trim() || isLoading) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  width: isMobile ? '100%' : 'auto',
                  flexShrink: isMobile ? 0 : 1
                }}
              >
                Get Address
              </button>
            </div>
          </div>

          {showWizardMessage && wizardWorkAddress && (
            <div style={{
              padding: isMobile ? '0.875rem' : '1rem',
              backgroundColor: '#e6f2ff',
              border: '1px solid #0070f3',
              borderRadius: '4px',
              fontSize: isMobile ? '0.8125rem' : '0.875rem',
              color: '#004085',
              lineHeight: '1.5',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}>
              <strong>✨ Work address prepopulated:</strong> Your work address from the Neighborhood Finder has been automatically filled in as the destination. Enter the home address above to see the true commute time!
            </div>
          )}

          {/* Starting Address Section */}
          <div style={{ 
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
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
              maxWidth: '100%',
              boxSizing: 'border-box',
              margin: 0,
              padding: 0,
              marginBottom: '0.75rem'
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
            {!isMobile && originLocation && (
              <div style={{ 
                marginTop: '1rem',
                width: '100%',
                maxWidth: '400px'
              }}>
                <MapStreetViewToggle 
                  key="origin-view" 
                  location={originLocation} 
                  width={400} 
                  height={300} 
                />
              </div>
            )}
            {isMobile && originLocation && (
              <div style={{ 
                marginTop: '1rem',
                width: '100%',
                maxWidth: '100%'
              }}>
                <MapStreetViewToggle 
                  key="origin-view-mobile" 
                  location={originLocation} 
                  width={undefined} 
                  height={250} 
                />
              </div>
            )}
          </div>

          {/* Destination Address Section */}
          <div style={{ 
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: '#000', 
              fontWeight: '500',
              fontSize: isMobile ? '0.875rem' : '1rem'
            }}>
              Destination Address:
            </label>
            <div style={{ 
              width: '100%', 
              maxWidth: '100%',
              boxSizing: 'border-box',
              margin: 0,
              padding: 0,
              marginBottom: '0.75rem'
            }}>
              <AddressAutocomplete
                placeholder="Enter destination address..."
                value={destinationAddress}
                onChange={setDestinationAddress}
                onPlaceSelected={(place) => {
                  if (place.formatted_address) {
                    setDestinationAddress(place.formatted_address)
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
                    setDestinationLocation(location)
                    // Save to history
                    if (place.formatted_address) {
                      saveDestinationToHistory(place.formatted_address)
                    }
                  }
                }}
              />
            </div>
            <AddressHistory
              addresses={destinationHistory}
              onSelectAddress={handleSelectDestinationFromHistory}
              onClearHistory={clearDestinationHistory}
            />
            {!isMobile && destinationLocation && (
              <div style={{ 
                marginTop: '1rem',
                width: '100%',
                maxWidth: '400px'
              }}>
                <MapStreetViewToggle 
                  key="destination-view" 
                  location={destinationLocation} 
                  width={400} 
                  height={300} 
                />
              </div>
            )}
            {isMobile && destinationLocation && (
              <div style={{ 
                marginTop: '1rem',
                width: '100%',
                maxWidth: '100%'
              }}>
                <MapStreetViewToggle 
                  key="destination-view-mobile" 
                  location={destinationLocation} 
                  width={undefined} 
                  height={250} 
                />
              </div>
            )}
          </div>

          {/* Arrival Time Section */}
          <div style={{ 
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: '#000', 
              fontWeight: '500',
              fontSize: isMobile ? '0.875rem' : '1rem'
            }}>
              Desired Arrival Time:
            </label>
            <input
              type="datetime-local"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: isMobile ? '0.9375rem' : '1rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                color: '#000',
                backgroundColor: '#fff',
                boxSizing: 'border-box'
              }}
            />
            <p style={{ 
              fontSize: '0.875rem', 
              color: '#666', 
              marginTop: '0.5rem',
              marginBottom: 0
            }}>
              Specify when you want to arrive at your destination for more accurate commute times based on traffic conditions.
            </p>
          </div>

          {/* Transportation Mode Section */}
          <div style={{ 
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: '#000', 
              fontWeight: '500',
              fontSize: isMobile ? '0.875rem' : '1rem'
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
                      fetchTransitStops(results.location.lat, results.location.lng, newMode, 0, 3, includeSubway)
                    }
                  } else {
                    setTransitType(null)
                    setTransitStops([])
                    setSelectedStop(null)
                    setLeg1Mode(null)
                    setHasMoreStops(false)
                    setTransitStopsOffset(0)
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
              
              {/* Include Subway checkbox - only shown when Train is selected */}
              {transportMode === 'train' && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginTop: '0.75rem'
                }}>
                  <input
                    type="checkbox"
                    id="includeSubway"
                    checked={includeSubway}
                    onChange={(e) => {
                      setIncludeSubway(e.target.checked)
                      // Refetch stops with new setting if we have location
                      if (results?.location) {
                        fetchTransitStops(results.location.lat, results.location.lng, transportMode, 0, 3, e.target.checked)
                      }
                    }}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <label
                    htmlFor="includeSubway"
                    style={{
                      cursor: 'pointer',
                      fontSize: '0.9375rem',
                      color: '#000',
                      userSelect: 'none'
                    }}
                  >
                    Include Subway stops
                  </label>
                </div>
              )}
          </div>

          {/* Transit Stop Selection - shown when bus/train is selected */}
          {(transportMode === 'bus' || transportMode === 'train') && results?.location && (
            <>
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
                              // Clear commute results when a different station is selected
                              const isDifferentStop = selectedStop?.placeId !== stop.placeId
                              if (isDifferentStop) {
                                setCommuteResults(null)
                              }
                              setSelectedStop(stop)
                              setLeg1Mode('driving') // Default to driving when stop is selected
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
                      {transitStops.length > 0 && (
                        <button
                          onClick={() => setShowTransitStopsModal(true)}
                          style={{
                            padding: '0.75rem 1rem',
                            fontSize: '0.875rem',
                            backgroundColor: '#0070f3',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            marginTop: '0.5rem',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#0056b3'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#0070f3'
                          }}
                        >
                          Show More
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '1rem', color: '#666', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                      No {transportMode === 'bus' ? 'bus' : 'train'} stops found nearby. Try a different address.
                    </div>
                  )}
                </div>
                <div style={{ flexShrink: 0 }}>
                  {selectedStop && results?.location ? (
                    <TransitStopDirectionsMap
                      origin={results.location}
                      destination={{
                        lat: selectedStop.location.lat,
                        lng: selectedStop.location.lng,
                        name: selectedStop.name
                      }}
                      mode={leg1Mode || 'driving'}
                      width={400}
                      height={300}
                    />
                  ) : (
                    <MapStreetViewToggle 
                      key="transit-stop-view" 
                      location={selectedStop ? selectedStop.location : null} 
                      width={400} 
                      height={300} 
                    />
                  )}
                </div>
              </div>

              {/* Transit Stops Modal */}
              {results?.location && (
                <TransitStopsModal
                  isOpen={showTransitStopsModal}
                  onClose={() => setShowTransitStopsModal(false)}
                  onSelectStop={(stop: TransitStop) => {
                    console.log('Page: Stop selected from modal', { 
                      name: stop.name, 
                      placeId: stop.placeId, 
                      address: stop.address,
                      location: stop.location
                    })
                    // Clear commute results when a different station is selected
                    const isDifferentStop = selectedStop?.placeId !== stop.placeId
                    if (isDifferentStop) {
                      setCommuteResults(null)
                    }
                    // Update both selectedStop and transitStops to ensure consistency
                    setSelectedStop(stop)
                    // Also update transitStops if this stop is not in the current list
                    setTransitStops(prev => {
                      const exists = prev.some(s => s.placeId === stop.placeId)
                      if (exists) {
                        return prev
                      }
                      // Add the selected stop to the list if it's not there
                      return [stop, ...prev]
                    })
                    setLeg1Mode('driving')
                    setShowTransitStopsModal(false)
                  }}
                  selectedStop={selectedStop}
                  initialStops={transitStops}
                  fetchStops={fetchStopsForModal}
                  transportMode={transportMode}
                  originLocation={results.location}
                />
              )}

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
                  {!isMobile && (
                    <div style={{ flexShrink: 0, width: '400px', maxWidth: '100%' }}>
                      {/* Spacer to match address field width */}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <button 
            type="submit"
            disabled={isLoading || !address || !destinationAddress || !arrivalTime}
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
            {isLoading ? 'Searching...' : 'Get True Commute Time'}
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
                    arrivalTime={arrivalTime ? Math.floor(new Date(arrivalTime).getTime() / 1000) : undefined}
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
                    arrivalTime={arrivalTime ? Math.floor(new Date(arrivalTime).getTime() / 1000) : undefined}
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
