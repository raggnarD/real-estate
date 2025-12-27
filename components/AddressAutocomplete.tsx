'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { useApiKey } from '@/contexts/ApiKeyContext'

interface AddressAutocompleteProps {
  onPlaceSelected?: (place: google.maps.places.PlaceResult) => void
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

export default function AddressAutocomplete({
  onPlaceSelected,
  placeholder = 'Enter address',
  value,
  onChange,
  onKeyDown,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { isLoading: apiKeyLoading, getEffectiveApiKey } = useApiKey()

  useEffect(() => {
    const initAutocomplete = async () => {
      if (!inputRef.current || apiKeyLoading) return
      
      // Get the effective API key (user's key or shared key if consented)
      const apiKeyToUse = await getEffectiveApiKey()
      
      if (!apiKeyToUse) {
        setIsLoading(false)
        return
      }

      try {
        const loader = new Loader({
          apiKey: apiKeyToUse,
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
  }, [onPlaceSelected, onChange, apiKeyLoading, getEffectiveApiKey])

  const isEmpty = !value || value.trim() === ''

  return (
    <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          if (onChange) onChange(e.target.value)
        }}
        onKeyDown={(e) => {
          // Prevent form submission when Enter is pressed in the address field
          // This allows users to type without accidentally submitting the form
          if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            e.stopPropagation()
          }
          // Call custom onKeyDown handler if provided
          if (onKeyDown) {
            onKeyDown(e)
          }
        }}
        style={{
          width: '100%',
          padding: '0.5rem',
          paddingRight: isEmpty ? '2.5rem' : '0.5rem',
          fontSize: '0.875rem',
          border: '1px solid #ddd',
          borderRadius: '4px',
          color: '#333',
          backgroundColor: '#fff',
          boxSizing: 'border-box'
        }}
      />
      {isEmpty && !isLoading && (
        <div style={{ 
          position: 'absolute', 
          right: '10px', 
          top: '50%', 
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ color: '#666' }}
          >
            <path 
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" 
              fill="currentColor"
            />
          </svg>
        </div>
      )}
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


