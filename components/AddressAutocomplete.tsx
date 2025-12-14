'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface AddressAutocompleteProps {
  onPlaceSelected?: (place: google.maps.places.PlaceResult) => void
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
}

export default function AddressAutocomplete({
  onPlaceSelected,
  placeholder = 'Enter address',
  value,
  onChange,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAutocomplete = async () => {
      if (!inputRef.current) return

      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
          libraries: ['places'],
        })

        await loader.load()

        if (inputRef.current && !autocompleteRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(
            inputRef.current,
            {
              types: ['address'],
              fields: ['formatted_address', 'geometry', 'address_components'],
            }
          )

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()
            if (place && onPlaceSelected) {
              onPlaceSelected(place)
            }
            if (place?.formatted_address && onChange) {
              onChange(place.formatted_address)
            }
          })

          autocompleteRef.current = autocomplete
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error)
        setIsLoading(false)
      }
    }

    initAutocomplete()
  }, [onPlaceSelected, onChange])

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          if (onChange) onChange(e.target.value)
        }}
        style={{
          width: '100%',
          padding: '0.75rem',
          fontSize: '1rem',
          border: '1px solid #ccc',
          borderRadius: '4px',
          color: '#000',
          backgroundColor: '#fff',
        }}
      />
      {isLoading && (
        <div style={{ 
          position: 'absolute', 
          right: '10px', 
          top: '50%', 
          transform: 'translateY(-50%)',
          fontSize: '0.875rem',
          color: '#666'
        }}>
          Loading...
        </div>
      )}
    </div>
  )
}

