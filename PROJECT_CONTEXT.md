# Project Context Documentation

## Overview

**RushRoost** is a real estate application that helps users evaluate properties by calculating commute times and finding neighborhoods within specified commute ranges. The application provides interactive maps, transit information, and integration with Zillow for property listings.

**Project Name:** commute-time-calculator (internal) / RushRoost (public-facing)  
**Version:** 0.1.0  
**Framework:** Next.js 16 with React 19  
**Language:** TypeScript

## Core Functionality

### Main Features

1. **Commute Time Calculator** (`/`)
   - Calculate commute times from a home address to a destination (work, school, etc.)
   - Support for multiple transportation modes: driving, walking, bicycling, bus, train
   - Multi-leg transit journeys (e.g., drive to station → train → destination)
   - Arrival time scheduling for accurate transit routing
   - Interactive Google Maps integration with Street View toggle
   - Transit stop finder with distance calculations
   - Address history for quick re-searches
   - Zillow integration for property listings

2. **Neighborhood Finder** (`/neighborhood-finder`)
   - Find cities/neighborhoods within a specified commute time from a work address
   - Filter by transportation mode and maximum commute time
   - View results as list, map, or both
   - Interactive map with city markers
   - Integration with Zillow for property search

3. **Account Management** (`/account`)
   - API key management
   - Shared API key activation/revocation
   - User preferences

## Technology Stack

### Core Dependencies
- **Next.js 16.0.0** - React framework with App Router
- **React 19.0.0** - UI library
- **TypeScript 5.5.4** - Type safety
- **@googlemaps/js-api-loader 1.16.2** - Google Maps integration
- **date-fns 3.6.0** - Date manipulation
- **@vercel/analytics 1.1.1** - Analytics

### Development Dependencies
- **Jest 29.7.0** - Unit testing
- **@testing-library/react 16.1.0** - React component testing
- **@playwright/test 1.40.0** - E2E testing
- **Tailwind CSS 3.4.7** - Styling
- **ESLint** - Code linting

## Project Structure

```
real-estate/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Main commute calculator page
│   ├── layout.tsx                # Root layout with providers
│   ├── account/                  # Account management page
│   ├── neighborhood-finder/      # Neighborhood finder page
│   └── api/                      # API routes
│       ├── geocode/              # Address geocoding
│       ├── commute/              # Commute time calculations
│       ├── transit-stops/        # Find nearby transit stops
│       ├── streetview/           # Street View image URLs
│       ├── zillow/               # Zillow property URLs
│       ├── neighborhood-finder/  # Neighborhood search
│       └── shared-key/           # Shared API key management
│           ├── get/              # Retrieve shared key
│           ├── activate/         # Activate shared key
│           ├── revoke/           # Revoke shared key
│           └── status/           # Check shared key status
├── components/                    # React components
│   ├── AddressAutocomplete.tsx   # Google Places autocomplete
│   ├── AddressHistory.tsx        # Recent address selection
│   ├── ApiKeyBanner.tsx          # API key status banner
│   ├── CommuteMap.tsx            # Interactive commute map
│   ├── Navigation.tsx            # Site navigation
│   ├── NeighborhoodMap.tsx       # Neighborhood finder map
│   ├── NeighborhoodResults.tsx   # Neighborhood results list
│   ├── TransitStopsModal.tsx    # Transit stop selection
│   ├── StreetView.tsx            # Street View component
│   └── ...                       # Other UI components
├── contexts/                      # React Context providers
│   ├── ApiKeyContext.tsx         # API key state management
│   └── WizardContext.tsx         # Onboarding wizard state
├── hooks/                        # Custom React hooks
│   └── useScrollToResults.ts     # Auto-scroll to results
├── utils/                         # Utility functions
│   ├── apiKeyResolver.ts         # API key resolution logic
│   ├── apiCallProtection.ts      # API call rate limiting
│   ├── safeTrackedFetch.ts       # Fetch with error handling
│   ├── trackedFetch.ts           # Fetch with analytics
│   ├── zillowUrlBuilder.ts      # Zillow URL generation
│   └── cityDataLoader.ts         # City data loading
├── types/                         # TypeScript type definitions
│   └── googlemaps.d.ts           # Google Maps type extensions
├── e2e/                          # End-to-end tests
│   ├── neighborhood-finder.spec.ts
│   └── wizard-flow.spec.ts
└── data/                         # Static data files
    └── us-cities.json            # US cities database (not in repo)
```

## API Routes

### Client-Side API Endpoints

All API routes are located in `app/api/` and follow Next.js App Router conventions.

#### `/api/geocode`
- **Method:** GET
- **Purpose:** Convert address string to coordinates
- **Parameters:**
  - `address` (required): Address string to geocode
  - `apiKey` (optional): User's Google Maps API key
- **Returns:** `{ address, location: { lat, lng }, placeId }`

#### `/api/commute`
- **Method:** GET
- **Purpose:** Calculate commute time and distance
- **Parameters:**
  - `origin` (required): Origin coordinates or address
  - `destination` (required): Destination coordinates or address
  - `mode` (optional): `driving`, `walking`, `bicycling`, `transit` (default: `driving`)
  - `transitStop` (optional): Place ID for transit stop (for multi-leg journeys)
  - `leg1Mode` (optional): `walking` or `driving` (for transit journeys)
  - `transitType` (optional): `bus` or `train`
  - `arrivalTime` (optional): Unix timestamp in seconds
  - `apiKey` (optional): User's Google Maps API key
- **Returns:** Distance, duration, and mode information

#### `/api/transit-stops`
- **Method:** GET
- **Purpose:** Find nearby transit stops
- **Parameters:**
  - `location` (required): Coordinates `lat,lng`
  - `type` (optional): `bus`, `train`, or `subway`
  - `apiKey` (optional): User's Google Maps API key
- **Returns:** Array of transit stops with distances

#### `/api/streetview`
- **Method:** GET
- **Purpose:** Generate Street View image URL
- **Parameters:**
  - `location` (required): Coordinates `lat,lng`
  - `heading` (optional): Camera heading in degrees
  - `pitch` (optional): Camera pitch
- **Returns:** Street View image URL

#### `/api/zillow`
- **Method:** GET
- **Purpose:** Generate Zillow property URL
- **Parameters:**
  - `address` (required): Property address
  - `zpid` (optional): Zillow property ID
- **Returns:** Zillow URL

#### `/api/neighborhood-finder`
- **Method:** GET
- **Purpose:** Find cities within commute range
- **Parameters:**
  - `workAddress` (required): Work address
  - `maxCommuteTime` (required): Maximum commute time in minutes
  - `mode` (required): Transportation mode
  - `apiKey` (optional): User's Google Maps API key
- **Returns:** Array of cities with commute times

#### `/api/shared-key/*`
Shared API key management endpoints for users without their own Google Maps API key:
- **GET `/api/shared-key/get`**: Retrieve shared key (requires cookie)
- **POST `/api/shared-key/activate`**: Activate shared key (24-hour expiration)
- **POST `/api/shared-key/revoke`**: Revoke shared key
- **GET `/api/shared-key/status`**: Check shared key status and expiration

## State Management

### Context Providers

#### ApiKeyContext
Manages Google Maps API key state:
- User's own API key (stored in localStorage)
- Shared API key (from server cookie)
- Key activation/revocation
- Expiration tracking
- Priority: User key > Shared key > None

**Key Methods:**
- `getEffectiveApiKey()`: Returns the active API key (user or shared)
- `activateSharedKey()`: Activate 24-hour shared key
- `revokeSharedKey()`: Revoke shared key
- `checkSharedKeyStatus()`: Check expiration status

#### WizardContext
Manages onboarding wizard state:
- Wizard active/inactive state
- Current wizard step (`account`, `neighborhood-finder`, `commute-time`)
- Work address from wizard
- Completion status

**Key Methods:**
- `setWizardActive(boolean)`: Enable/disable wizard
- `setWizardStep(step)`: Set current step
- `setWorkAddress(address)`: Store work address
- `completeWizard()`: Mark wizard as complete

### Local Storage Keys

- `google_maps_api_key`: User's Google Maps API key
- `real-estate-address-history`: Recent home addresses (max 3)
- `real-estate-destination-history`: Recent destination addresses (max 3)
- `neighborhood-finder-work-address-history`: Recent work addresses (max 3)
- `wizard_completed`: Wizard completion flag
- `wizard_active`: Wizard active state
- `wizard_step`: Current wizard step
- `wizard_work_address`: Work address from wizard

## API Key Management

The application supports three API key sources (in priority order):

1. **User's Own API Key**: Stored in localStorage, highest priority
2. **Shared API Key**: Server-provided key with 24-hour expiration (cookie-based)
3. **No Key**: User must provide their own or activate shared key

### API Key Resolution Flow

1. Client checks localStorage for user's API key
2. If no user key, checks for active shared key cookie
3. Server-side: `resolveApiKey()` function checks:
   - User-provided key (from request)
   - Shared key cookie (if valid and not expired)
   - Environment variable `GOOGLE_MAPS_API_KEY` (fallback)

### Shared Key Security

- 24-hour expiration enforced via cookie
- Cookie contains expiration timestamp, not the key itself
- Key stored server-side in environment variable
- User must explicitly activate shared key
- Automatic revocation on expiration

## Google Maps Integration

### APIs Used

1. **Geocoding API**: Convert addresses to coordinates
2. **Distance Matrix API**: Calculate distances and durations
3. **Directions API**: Detailed routing (especially for transit with arrival times)
4. **Places API**: Address autocomplete, place details
5. **Maps JavaScript API**: Interactive maps, Street View
6. **Street View Static API**: Street View images

### Map Components

- **CommuteMap**: Shows route from origin to destination
- **NeighborhoodMap**: Shows cities within commute range
- **TransitStopDirectionsMap**: Shows route to selected transit stop
- **StreetView**: Embedded Street View imagery

## Testing

### Test Structure

- **Unit Tests**: Jest + React Testing Library
  - Located in `__tests__/` folders alongside source files
  - Coverage thresholds: 70% (branches, functions, lines, statements)

- **E2E Tests**: Playwright
  - Located in `e2e/` directory
  - Tests user flows and integrations

### Running Tests

```bash
# Unit tests
npm run test:unit
npm run test:watch
npm run test:coverage

# E2E tests
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:debug

# All tests
npm run test:all
```

### CI/CD

GitHub Actions workflow (`.github/workflows/test.yml`) runs:
1. Unit tests with coverage
2. E2E tests
3. Build validation

## Environment Variables

### Required (Server-Side)
- `GOOGLE_MAPS_API_KEY`: Google Maps API key for shared key feature

### Optional (Client-Side)
- User provides API key via UI (stored in localStorage)

### Development
- No `.env` files committed to repository
- See `.gitignore` for excluded files

## Deployment

### Vercel Configuration

- **Build Command**: `npm run test:unit -- --passWithNoTests && npm run build`
- **Dev Command**: `npm run dev`
- **Install Command**: `npm install`

### Build Process

1. Run unit tests (pass with no tests if none exist)
2. Build Next.js application
3. Deploy to Vercel

## Development Workflow

### Getting Started

```bash
# Install dependencies
npm install --legacy-peer-deps

# Install Playwright browsers
npx playwright install

# Run development server
npm run dev          # Port 3000
npm run dev:3001     # Port 3001
```

### Key Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run test`: Run unit tests
- `npm run test:e2e`: Run E2E tests

### Code Style

- TypeScript strict mode enabled
- ESLint with Next.js config
- React 19 with JSX transform
- Path aliases: `@/*` maps to project root

## Key Features & User Flows

### Commute Calculator Flow

1. User enters home address (autocomplete)
2. User enters destination address
3. User selects transportation mode
4. For transit: User can select transit stop and leg mode
5. User can set arrival time for accurate routing
6. System calculates commute time and distance
7. Results displayed with interactive map
8. User can toggle Street View
9. User can open Zillow listing for home address

### Neighborhood Finder Flow

1. User enters work address
2. User sets maximum commute time
3. User selects transportation mode
4. System finds cities within range
5. Results displayed as list and/or map
6. User can select city to view on Zillow

### Onboarding Wizard Flow

1. New users see wizard modal
2. Wizard guides through:
   - Account setup (API key)
   - Neighborhood finder
   - Commute calculator
3. Wizard state persists across sessions
4. Wizard completion prevents future prompts

## Data Sources

### External APIs
- **Google Maps APIs**: Geocoding, routing, maps, places
- **Zillow**: Property listings (URL generation only)

### Static Data
- **US Cities Database**: `data/us-cities.json` (not in repo, must be downloaded)
  - See `data/SETUP.md` for setup instructions

## Browser Compatibility

- Modern browsers with ES2017+ support
- Google Maps JavaScript API requirements
- LocalStorage support required
- Cookie support required (for shared keys)

## Security Considerations

1. **API Keys**: Never exposed in client-side code (except user's own key in localStorage)
2. **Shared Keys**: Server-side only, cookie-based expiration
3. **Rate Limiting**: Implemented via `apiCallProtection.ts`
4. **Input Validation**: All API routes validate required parameters
5. **Error Handling**: Graceful error handling with user-friendly messages

## Performance Optimizations

1. **Memoization**: React hooks (`useMemo`, `useCallback`) for expensive calculations
2. **Lazy Loading**: Google Maps API loaded on demand
3. **Caching**: Address history in localStorage
4. **Efficient API Calls**: Distance Matrix API for simple queries, Directions API only when needed
5. **Image Optimization**: Next.js automatic image optimization

## Known Limitations

1. **US Cities Database**: Must be manually downloaded (not in repo)
2. **Zillow Integration**: URL generation only, no direct API access
3. **Transit Data**: Limited to Google Maps transit data availability
4. **API Quotas**: Subject to Google Maps API usage limits

## Future Enhancements (Potential)

- Direct Zillow API integration
- Saved searches and favorites
- Multiple destination support
- Commute time comparisons
- Historical commute time data
- Mobile app version
- Real-time transit updates
- Traffic pattern analysis

## Troubleshooting

### Common Issues

1. **API Key Errors**: Check localStorage and shared key status
2. **Maps Not Loading**: Verify API key and Google Maps API quotas
3. **Transit Routes Not Found**: Some areas have limited transit data
4. **Build Failures**: Ensure all dependencies installed with `--legacy-peer-deps`

### Debug Tools

- `ApiKeyDebug` component for API key troubleshooting
- Browser console logs for API call tracking
- Network tab for API request inspection

## Contributing

1. Follow TypeScript strict mode
2. Write tests for new features
3. Maintain 70% test coverage
4. Follow existing code structure
5. Update this documentation for significant changes

## License

Private project - see repository for license information.

---

**Last Updated**: January 24, 2026  
**Maintained By**: Project Team  
**Documentation Version**: 1.0
