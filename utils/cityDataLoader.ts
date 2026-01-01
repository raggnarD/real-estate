/**
 * City Data Loader
 * 
 * This utility loads and filters US city data from a JSON file.
 * The data file should be downloaded from https://simplemaps.com/data/us-cities
 * and placed in the data/ directory as us-cities.json
 * 
 * City data source: https://simplemaps.com/data/us-cities
 * The fallback city data used by this application was accessed via SimpleMaps.
 * 
 * Expected JSON format (array of objects):
 * [
 *   {
 *     "city": "New York",
 *     "state_id": "NY",
 *     "state_name": "New York",
 *     "lat": 40.7128,
 *     "lng": -74.0060,
 *     "population": 8175133,
 *     ...
 *   },
 *   ...
 * ]
 */

import fs from 'fs'
import path from 'path'

export interface CityData {
  city: string
  state_id: string
  state_name: string
  lat: number | string
  lng: number | string
  population?: number | string
  [key: string]: any // Allow other fields
}

let cityDataCache: CityData[] | null = null

/**
 * Loads city data from JSON file (cached after first load)
 * This works in Next.js API routes (server-side only)
 */
export async function loadCityData(): Promise<CityData[]> {
  if (cityDataCache) {
    return cityDataCache
  }

  try {
    // Load from data directory (relative to project root)
    const dataPath = path.join(process.cwd(), 'data', 'us-cities.json')
    
    if (fs.existsSync(dataPath)) {
      const fileContent = fs.readFileSync(dataPath, 'utf-8')
      cityDataCache = JSON.parse(fileContent) as CityData[]
      return cityDataCache
    } else {
      console.warn('City data file not found at:', dataPath)
      console.warn('Please download us-cities.json from https://simplemaps.com/data/us-cities')
      console.warn('The neighborhood finder will still work using Places API, but may miss some cities.')
      return []
    }
  } catch (error) {
    console.error('Error loading city data:', error)
    return []
  }
}

/**
 * Gets all cities for a specific state
 */
export async function getCitiesByState(stateId: string): Promise<CityData[]> {
  const allCities = await loadCityData()
  return allCities.filter(city => 
    city.state_id?.toUpperCase() === stateId.toUpperCase()
  )
}

/**
 * Gets cities within a radius of a location (simple distance calculation)
 * This is a rough filter - actual commute time will be calculated via Distance Matrix API
 */
export async function getCitiesNearLocation(
  lat: number,
  lng: number,
  radiusKm: number = 200,
  stateId?: string
): Promise<CityData[]> {
  const allCities = await loadCityData()
  
  let cities = stateId 
    ? allCities.filter(city => city.state_id?.toUpperCase() === stateId.toUpperCase())
    : allCities

  // Filter by approximate distance (Haversine formula)
  const filteredCities = cities.filter(city => {
    const cityLat = typeof city.lat === 'string' ? parseFloat(city.lat) : city.lat
    const cityLng = typeof city.lng === 'string' ? parseFloat(city.lng) : city.lng
    
    if (isNaN(cityLat) || isNaN(cityLng)) return false
    
    const distance = haversineDistance(lat, lng, cityLat, cityLng)
    return distance <= radiusKm
  })

  // Sort by distance
  filteredCities.sort((a, b) => {
    const latA = typeof a.lat === 'string' ? parseFloat(a.lat) : a.lat
    const lngA = typeof a.lng === 'string' ? parseFloat(a.lng) : a.lng
    const latB = typeof b.lat === 'string' ? parseFloat(b.lat) : b.lat
    const lngB = typeof b.lng === 'string' ? parseFloat(b.lng) : b.lng
    
    const distA = haversineDistance(lat, lng, latA, lngA)
    const distB = haversineDistance(lat, lng, latB, lngB)
    return distA - distB
  })

  return filteredCities
}

/**
 * Haversine formula to calculate distance between two points in kilometers
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Formats city data for use with Google Maps Geocoding API
 */
export function formatCityForGeocoding(city: CityData): string {
  const stateName = city.state_name || city.state_id
  return `${city.city}, ${stateName}`
}

