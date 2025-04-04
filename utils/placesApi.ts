// Utility functions for interacting with the Google Places API
import { mockPizzaPlaces } from './mockPizzaData';

// Note: In a production app, you would store this in a secure environment variable
// For development purposes, we'll include it here
// You'll need to replace this with your actual Google Places API key
const API_KEY = "AIzaSyABZPisEjlYgkA7l3PyvC8NPlaFJVTV-bk";

// Configuration flags
const USE_MOCK_DATA = false;
const USE_PROXY_SERVER = true;
const USE_BROOKLYN_DATA = true; // New flag to use our Brooklyn pizza dataset

// URL for the proxy server
// In development, this could be a local server
// In production, this would be your deployed server URL
const PROXY_SERVER_URL = "https://pizzarat-api.vercel.app/api";

// Import Brooklyn pizza data functions
import { 
  getAllBrooklynPizzaPlaces, 
  getNearbyBrooklynPizzaPlaces,
  getPizzaPlaceById
} from './brooklynPizzaData';

export interface PlaceResult {
  id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  place_id: string;
  price_level?: number;
  opening_hours?: {
    open_now: boolean;
  };
  types?: string[];
  formattedAddress?: string;
  location?: any
  priceLevel?:string,
  userRatingCount?:any,
  displayName?:any
}

export interface PlacesResponse {
  results: PlaceResult[];
  status: string;
  next_page_token?: string;
}

/**
 * Searches for nearby pizza places within a specified radius
 * @param latitude Current latitude
 * @param longitude Current longitude
 * @param radius Search radius in meters (2 miles ≈ 3218 meters)
 * @returns Promise with pizza place results
 */
export const searchNearbyPizzaPlaces = async (
  latitude: number,
  longitude: number,
  radius: number = 3218 // Default to 2 miles in meters
): Promise<PlaceResult[]> => {
  // Use mock data during development to avoid API issues
  if (USE_MOCK_DATA) {
    console.log('Using mock pizza place data');
    
    // For testing purposes, return all mock places regardless of distance
    // This ensures we see data while developing
    console.log(`Returning ${mockPizzaPlaces.length} mock pizza places`);
    return mockPizzaPlaces;
    
    /* Uncomment this code when you want to filter by actual distance
    // Filter mock data to only include places within the radius
    const filteredPlaces = mockPizzaPlaces.filter(place => {
      const distance = calculateDistance(
        latitude,
        longitude,
        place.geometry.location.lat,
        place.geometry.location.lng
      );
      // Convert kilometers to meters for comparison
      return distance * 1000 <= radius;
    });
    
    return filteredPlaces;
    */
  }
  
  // Real API implementation
  try {
    let endpoint;
    let response;
    
    if (USE_PROXY_SERVER) {
      // Use our secure proxy server
      endpoint = `${PROXY_SERVER_URL}/places/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;
      console.log('Fetching pizza places via proxy server');
      
      response = await fetch(endpoint);
    } else {
      // Direct API call with CORS proxy (not recommended for production)
      const corsProxy = 'https://cors-anywhere.herokuapp.com/';
      endpoint = `${corsProxy}https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=restaurant&keyword=pizza&key=${API_KEY}`;
      
      console.log('Fetching pizza places directly from Google Places API');
      
      response = await fetch(endpoint, {
        headers: {
          'Origin': 'https://pizzarat.app' // Use your app's domain here
        }
      });
    }
    
    if (!response.ok) {
      console.error(`API request failed with status: ${response.status}`);
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data: PlacesResponse = await response.json();
    
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Error fetching places:", data.status);
      return [];
    }
    
    // Filter to only include places with "pizza_restaurant" type
    const pizzaRestaurants = (data.results || []).filter(place => 
      place.types && place.types.includes('pizza_restaurant')
    );
    
    console.log(`Found ${pizzaRestaurants.length} pizza restaurants out of ${data.results?.length || 0} places`);
    return pizzaRestaurants;
  } catch (error) {
    console.error("Error searching for pizza places:", error);
    // Fall back to mock data if the API request fails
    console.log('Falling back to mock data due to API error');
    return mockPizzaPlaces;
  }
};

/**
 * Calculate distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Gets a photo URL for a place
 * @param photoReference The photo reference from the Places API
 * @param maxWidth Maximum width of the photo
 * @returns URL to the photo
 */
export const getPlacePhotoUrl = (
  photoReference: string,
  maxWidth: number = 400
): string => {
  // For Brooklyn data or mock data, return a placeholder image
  if (USE_BROOKLYN_DATA || USE_MOCK_DATA) {
    // For Brooklyn data, we don't have photo references, so use a placeholder
    // You could enhance this by using neighborhood-specific images
    const neighborhood = photoReference.split('_')[0] || '';
    return `https://via.placeholder.com/${maxWidth}x${maxWidth/1.5}?text=Pizza+in+${neighborhood}`;
  }
  
  if (USE_PROXY_SERVER) {
    // Use our secure proxy server for photos
    return `${PROXY_SERVER_URL}/places/photo?photoReference=${photoReference}&maxWidth=${maxWidth}`;
  }
  
  // Direct API call (not recommended for production)
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${API_KEY}`;
};

/**
 * Gets details for a specific place
 * @param placeId The Google Place ID
 * @returns Promise with detailed place information
 */
export const getPlaceDetails = async (placeId: string): Promise<any> => {
  // Use Brooklyn data if enabled
  if (USE_BROOKLYN_DATA) {
    console.log('Getting place details from Brooklyn dataset');
    const place = await getPizzaPlaceById(placeId);
    
    if (place) {
      // Get the neighborhood from the custom property we added
      const neighborhood = (place as any).neighborhood || 'Brooklyn';
      const rating = place.rating || 4.0;
      
      // Enhance the place with additional details
      return {
        ...place,
        formatted_phone_number: "(718) 555-" + Math.floor(1000 + Math.random() * 9000),
        formatted_address: place.vicinity,
        website: `https://example.com/pizza/${place.id}`,
        opening_hours: {
          weekday_text: [
            "Monday: 11:00 AM – 10:00 PM",
            "Tuesday: 11:00 AM – 10:00 PM",
            "Wednesday: 11:00 AM – 10:00 PM",
            "Thursday: 11:00 AM – 10:00 PM",
            "Friday: 11:00 AM – 11:00 PM",
            "Saturday: 11:00 AM – 11:00 PM",
            "Sunday: 12:00 PM – 9:00 PM"
          ]
        },
        reviews: [
          {
            author_name: "Brooklyn Pizza Fan",
            rating: Math.min(5, rating + 0.2),
            text: `Great ${neighborhood} pizza spot! Authentic Brooklyn style.`
          },
          {
            author_name: "NYC Foodie",
            rating: Math.max(3, rating - 0.5),
            text: `Solid pizza joint in ${neighborhood}. Good value for the price.`
          }
        ]
      };
    }
    return null;
  }
  
  // Use mock data during development
  if (USE_MOCK_DATA) {
    const mockPlace = mockPizzaPlaces.find(place => place.place_id === placeId);
    if (mockPlace) {
      return {
        ...mockPlace,
        formatted_phone_number: "(212) 555-" + Math.floor(1000 + Math.random() * 9000),
        formatted_address: mockPlace.vicinity + ", NY 10001",
        website: "https://example.com/pizza",
        reviews: [
          {
            author_name: "Pizza Lover",
            rating: 5,
            text: "Best pizza in NYC! The crust is perfect."
          },
          {
            author_name: "Food Critic",
            rating: 4,
            text: "Authentic New York style pizza. Great sauce and cheese ratio."
          }
        ]
      };
    }
    return null;
  }
  
  // Real API implementation
  try {
    let endpoint;
    let response;
    
    if (USE_PROXY_SERVER) {
      // Use our secure proxy server
      endpoint = `${PROXY_SERVER_URL}/places/details?placeId=${placeId}`;
      console.log('Fetching place details via proxy server');
      
      response = await fetch(endpoint);
    } else {
      // Direct API call (not recommended for production)
      endpoint = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,formatted_phone_number,formatted_address,opening_hours,website,review,price_level&key=${API_KEY}`;
      
      console.log('Fetching place details directly from Google Places API');
      
      const corsProxy = 'https://cors-anywhere.herokuapp.com/';
      response = await fetch(`${corsProxy}${endpoint}`, {
        headers: {
          'Origin': 'https://pizzarat.app'
        }
      });
    }
    
    if (!response.ok) {
      console.error(`API request failed with status: ${response.status}`);
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== "OK") {
      console.error("Error fetching place details:", data.status);
      return null;
    }
    
    return data.result;
  } catch (error) {
    console.error("Error getting place details:", error);
    
    // If Brooklyn data is available, use it as a fallback
    if (USE_BROOKLYN_DATA) {
      console.log('Falling back to Brooklyn dataset for place details');
      const place = await getPizzaPlaceById(placeId);
      if (place) {
        return place;
      }
    }
    
    return null;
  }
};
