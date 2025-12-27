'use client'

import { buildZillowUrl } from '@/utils/zillowUrlBuilder'

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

interface NeighborhoodResultsProps {
  cities: CityResult[]
  onCityClick?: (city: CityResult) => void
  selectedCityId?: string
}

export default function NeighborhoodResults({
  cities,
  onCityClick,
  selectedCityId,
}: NeighborhoodResultsProps) {
  if (cities.length === 0) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        color: '#666' 
      }}>
        No cities found
      </div>
    )
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '0.5rem',
      maxHeight: '600px',
      overflowY: 'auto'
    }}>
      {cities.map((city) => (
        <div
          key={city.placeId}
          onClick={() => onCityClick?.(city)}
          style={{
            padding: '1rem',
            backgroundColor: selectedCityId === city.placeId ? '#e6f2ff' : '#fff',
            border: selectedCityId === city.placeId ? '2px solid #0070f3' : '1px solid #ddd',
            borderRadius: '4px',
            cursor: onCityClick ? 'pointer' : 'default',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (onCityClick && selectedCityId !== city.placeId) {
              e.currentTarget.style.backgroundColor = '#f5f5f5'
            }
          }}
          onMouseLeave={(e) => {
            if (onCityClick && selectedCityId !== city.placeId) {
              e.currentTarget.style.backgroundColor = '#fff'
            }
          }}
        >
          <div style={{ fontWeight: '600', fontSize: '1.125rem', marginBottom: '0.25rem', color: '#000' }}>
            {city.name}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
            {city.address}
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: '#0070f3', fontWeight: '500' }}>
              ⏱️ {city.commuteTimeText}
            </span>
            <span style={{ color: '#666' }}>
              📍 {city.distance}
            </span>
            <a
              href={buildZillowUrl(city.address, city.name)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                color: '#0070f3',
                textDecoration: 'none',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8'
                e.currentTarget.style.textDecoration = 'underline'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.textDecoration = 'none'
              }}
            >
              🏠 View on Zillow
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}




