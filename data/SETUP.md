# City Data Setup Guide

## Overview

The neighborhood finder now uses a comprehensive US cities dataset from SimpleMaps to find all cities and towns, rather than relying solely on Google Places API searches.

**Data Source**: The fallback city data used by this application was accessed via https://simplemaps.com/data/us-cities

This provides:

- **Complete coverage**: All ~30,000 US cities and towns
- **Better reliability**: Works for all states, not just hardcoded lists
- **Faster results**: Pre-filtered by state and distance before API calls
- **Cost efficiency**: Reduces unnecessary Places API calls

## Setup Instructions

### Step 1: Download the Data

1. Visit https://simplemaps.com/data/us-cities
2. Click "Download" on the **Basic** (free) version
3. Choose **JSON** format (not CSV)
4. Save the file as `us-cities.json`

### Step 2: Place the File

1. Place `us-cities.json` in the `data/` directory:
   ```
   /data/us-cities.json
   ```

### Step 3: Verify

The file should be a JSON array with objects like:
```json
[
  {
    "city": "New York",
    "state_id": "NY",
    "state_name": "New York",
    "lat": 40.7128,
    "lng": -74.0060,
    "population": 8175133
  }
]
```

## How It Works

1. **City Data Loading**: The `cityDataLoader` utility loads the JSON file on first use (cached afterward)

2. **State Filtering**: Cities are filtered by the work address state (e.g., CA, PA)

3. **Distance Filtering**: Cities are filtered by approximate distance from work location using Haversine formula

4. **Geocoding**: Each city is reverse-geocoded to get Google Maps place_id and formatted address

5. **Commute Calculation**: Distance Matrix API calculates actual commute times for all cities

6. **Results**: Cities within the max commute time are returned, sorted by commute time

## Fallback Behavior

If the `us-cities.json` file is not found:
- The system will log a warning
- It will continue to work using Places API searches (Strategies 1 & 2)
- Results may be less comprehensive but still functional

## File Size

- **Basic version**: ~5-10 MB (30,000 cities)
- **Extended version**: ~10-20 MB (includes additional data)
- The Basic version is sufficient for the neighborhood finder

## Benefits Over Previous Approach

1. **No hardcoded lists**: Works for all 50 states automatically
2. **Complete coverage**: Includes small towns that Places API might miss
3. **Better performance**: Pre-filters by state and distance before expensive API calls
4. **Maintainable**: Update the data file periodically to get new cities

## Updating the Data

To update the city data:
1. Download the latest version from SimpleMaps
2. Replace `data/us-cities.json`
3. Restart the application (cache will refresh)

