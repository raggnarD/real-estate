# City Data Directory

This directory contains the US cities dataset for the neighborhood finder.

**Data Source**: The fallback city data used by this application was accessed via https://simplemaps.com/data/us-cities

## Setup Instructions

1. **Download the city data:**
   - Visit https://simplemaps.com/data/us-cities
   - Download the **Basic** (free) version in **JSON format**
   - Save the file as `us-cities.json` in this directory

2. **File Format:**
   The JSON file should be an array of city objects with at least these fields:
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

3. **Alternative:**
   If you prefer CSV format, you can convert it to JSON using a tool like:
   - Online: https://www.convertcsv.com/csv-to-json.htm
   - Or use a Node.js script to convert

## Usage

The city data is automatically loaded by the `cityDataLoader` utility and used by the neighborhood-finder API route to find cities within commute time.

## File Size

The Basic version contains ~30,000 US cities and is approximately 5-10 MB in JSON format, which is acceptable for a Next.js application.

