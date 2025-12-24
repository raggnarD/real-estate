'use client'

import { useState, useEffect } from 'react'

interface StreetViewProps {
  location: { lat: number; lng: number } | null
  width?: number
  height?: number
  fov?: number
  heading?: number
  pitch?: number
}

export default function StreetView({ 
  location, 
  width = 400, 
  height = 300,
  fov = 90,
  heading = 0,
  pitch = 0
}: StreetViewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!location) {
      setImageUrl(null)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    // Use our API route to fetch Street View
    const fetchStreetView = async () => {
      try {
        const response = await fetch(
          `/api/streetview?lat=${location.lat}&lng=${location.lng}&width=${width}&height=${height}&fov=${fov}&heading=${heading}&pitch=${pitch}`
        )

        if (response.ok) {
          // Check if response is actually an image
          const contentType = response.headers.get('content-type')
          if (contentType?.startsWith('image/')) {
            // Convert blob to object URL
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            setImageUrl(url)
            setError(null)
          } else {
            // Response might be JSON error
            const errorData = await response.json().catch(() => ({}))
            console.error('Street View API Error:', errorData)
            setError(errorData.error || errorData.details || 'Street View not available')
            setImageUrl(null)
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('Street View API Error:', errorData)
          let errorMessage = errorData.error || 'Street View not available'
          
          // Provide helpful error messages
          if (errorData.details) {
            errorMessage += ` (${errorData.details})`
          } else if (errorData.status === 'REQUEST_DENIED') {
            errorMessage = 'Street View API not enabled. Please enable Street View Static API in Google Cloud Console.'
          } else if (errorData.status === 'ZERO_RESULTS') {
            errorMessage = 'Street View imagery is not available for this location'
          }
          
          setError(errorMessage)
          setImageUrl(null)
        }
      } catch (err) {
        console.error('Error fetching Street View:', err)
        setError('Failed to load Street View')
        setImageUrl(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStreetView()

    // Cleanup object URL on unmount or location change
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [location?.lat, location?.lng, width, height, fov, heading, pitch])

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
        Enter an address to see Street View
      </div>
    )
  }

  if (isLoading) {
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
        Loading Street View...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: '#f0f0f0',
        border: '1px solid #ddd',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666',
        fontSize: '0.875rem',
        padding: '1rem',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '0.5rem' }}>{error}</div>
        <div style={{ fontSize: '0.75rem', color: '#999' }}>
          Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
        </div>
      </div>
    )
  }

  if (!imageUrl) {
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
        No image available
      </div>
    )
  }

  return (
    <div style={{
      width: `${width}px`,
      height: `${height}px`,
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid #ddd',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <img
        src={imageUrl}
        alt="Street View"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
    </div>
  )
}

