# PizzaRat API Proxy Server

This server acts as a secure proxy between the PizzaRat mobile app and the Google Places API. It helps protect your API key and provides a clean interface for the app to interact with.

## Why a Proxy Server?

1. **Security**: Keeps your Google Places API key secure by not exposing it in client-side code
2. **CORS**: Avoids cross-origin resource sharing (CORS) issues that occur when calling the Places API directly
3. **Rate Limiting**: Allows you to implement rate limiting and caching if needed
4. **Customization**: Enables customized responses and error handling

## Setup Instructions

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- A Google Places API key (see `/GOOGLE_PLACES_API_SETUP.md` for instructions)

### Installation

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

3. Create a `.env` file based on the example:
   ```
   cp .env.example .env
   ```

4. Edit the `.env` file and add your Google Places API key:
   ```
   GOOGLE_PLACES_API_KEY=your_api_key_here
   ```

### Running Locally

Start the development server:
```
npm run dev
```

The server will be available at `http://localhost:3000`.

## API Endpoints

### 1. Search Nearby Pizza Places

**Endpoint**: `/api/places/nearby`

**Method**: GET

**Parameters**:
- `latitude` (required): Latitude coordinate
- `longitude` (required): Longitude coordinate
- `radius` (optional): Search radius in meters (default: 3218, which is about 2 miles)

**Example**:
```
GET /api/places/nearby?latitude=40.7128&longitude=-74.0060&radius=5000
```

### 2. Get Place Details

**Endpoint**: `/api/places/details`

**Method**: GET

**Parameters**:
- `placeId` (required): Google Place ID

**Example**:
```
GET /api/places/details?placeId=ChIJN1t_tDeuEmsRUsoyG83frY4
```

### 3. Get Place Photo

**Endpoint**: `/api/places/photo`

**Method**: GET

**Parameters**:
- `photoReference` (required): Photo reference string from Places API
- `maxWidth` (optional): Maximum width of the photo (default: 400)

**Example**:
```
GET /api/places/photo?photoReference=CnRvAAAAwMpdHeWlXl-lH0vp7lez4znKPIWSWvgvZFISdKx45AwJVP1Qp37YOrH7sqHMJ8C-vBDC546decipPHchJhHZL94RcTUfPa1jWzo-rSHaTlbNtjh-N68RkcToUCuY9v2HNpo5mziqkir37WU8FJEqVBIQ&maxWidth=800
```

## Deployment

### Vercel

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Deploy:
   ```
   vercel
   ```

3. Set environment variables in the Vercel dashboard.

### Heroku

1. Install the Heroku CLI and log in.

2. Create a new Heroku app:
   ```
   heroku create pizzarat-api
   ```

3. Set environment variables:
   ```
   heroku config:set GOOGLE_PLACES_API_KEY=your_api_key_here
   ```

4. Deploy:
   ```
   git subtree push --prefix server heroku main
   ```

## Updating the Mobile App

After deploying your proxy server, update the `PROXY_SERVER_URL` in `/utils/placesApi.ts` to point to your deployed server URL.
