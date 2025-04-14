import { PlaceResult } from './placesApi';
import { loadManhattanPizzaData } from './manhattanPizzaData';

// Define the structure of our Brooklyn pizza data
export interface BrooklynPizzaPlace {
  id: string;
  types: string[];
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
  rating: number;
  priceLevel: string;
  userRatingCount?: number;
  displayName: {
    text: string;
    languageCode: string;
  };
  neighborhood: string;
  borough: string;
}

export interface BrooklynPizzaData {
  metadata: {
    total_places: number;
    borough: string;
    neighborhoods: string[];
  };
  places: BrooklynPizzaPlace[];
}

// Function to load the Brooklyn pizza data
export const loadBrooklynPizzaData = async (): Promise<BrooklynPizzaData> => {
  try { 
    const manhattanData = await loadManhattanPizzaData();
  
    return manhattanData as BrooklynPizzaData;
  } catch (error) {
    console.error('Error loading Brooklyn pizza data:', error);
    throw error;
  }
};

// Convert Brooklyn pizza place to PlaceResult format for compatibility
export const convertToPlaceResult = (place: BrooklynPizzaPlace): PlaceResult => {
  // Map price level string to number
  const priceLevelMap: Record<string, number> = {
    'PRICE_LEVEL_FREE': 0,
    'PRICE_LEVEL_INEXPENSIVE': 1,
    'PRICE_LEVEL_MODERATE': 2,
    'PRICE_LEVEL_EXPENSIVE': 3,
    'PRICE_LEVEL_VERY_EXPENSIVE': 4
  };
  
  // Create a base PlaceResult object
  const result: PlaceResult = {
    id: place.id,
    place_id: place.id,
    name: place.displayName.text,
    vicinity: place.formattedAddress.split(',').slice(0, 2).join(','),
    geometry: {
      location: {
        lat: place.location.latitude,
        lng: place.location.longitude
      }
    },
    rating:0,
    user_ratings_total: place.userRatingCount || 0,
    price_level: priceLevelMap[place.priceLevel] || 0,
    photos: [],
    regularOpeningHours: place.regularOpeningHours
  };
  
  // Add custom properties using type assertion
  const enhancedResult = result as any;
  enhancedResult.types = place.types;
  enhancedResult.neighborhood = place.neighborhood;
  enhancedResult.borough = place.borough;
  
  return enhancedResult as PlaceResult;
};

// Get all pizza places
export const getAllBrooklynPizzaPlaces = async (): Promise<PlaceResult[]> => {
  try {
    const data = await loadBrooklynPizzaData();
    // Filter places to only include those with "pizza_restaurant" type
    const pizzaRestaurants = data.places.filter(place => 
      place.types.includes('pizza_restaurant')
    );
    console.log(`Filtered ${pizzaRestaurants.length} pizza restaurants out of ${data.places.length} total places`);
    return pizzaRestaurants.map(place => convertToPlaceResult(place));
  } catch (error) {
    console.error('Error getting all Brooklyn pizza places:', error);
    return [];
  }
};

// Get pizza places in a specific neighborhood
export const getPizzaPlacesByNeighborhood = async (neighborhood: string): Promise<PlaceResult[]> => {
  try {
    const data = await loadBrooklynPizzaData();
    const filteredPlaces = data.places.filter(place => 
      place.neighborhood.toLowerCase() === neighborhood.toLowerCase()
    );
    return filteredPlaces.map(place => convertToPlaceResult(place));
  } catch (error) {
    console.error(`Error getting pizza places in ${neighborhood}:`, error);
    return [];
  }
};

// Get pizza places near a location with a specified radius (in meters)
export const getNearbyBrooklynPizzaPlaces = async (
  latitude: number, 
  longitude: number, 
  radius: number = 3218, // Default to 2 miles
  setAllPlaces?: (places: PlaceResult[]) => void
): Promise<PlaceResult[]> => {
  try {
    const data = await loadBrooklynPizzaData();
    const pizzaRestaurants = data.places.filter(place => 
      place.types.includes('pizza_restaurant')
    );
    setAllPlaces?.(pizzaRestaurants.map(place => convertToPlaceResult(place)));
    
    // Calculate distance between two points using the Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371e3; // Earth's radius in meters
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lon2 - lon1) * Math.PI / 180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // Distance in meters
    };
    
    // Filter places within the radius and only include pizza restaurants
    const nearbyPlaces = data.places.filter(place => {
      // Check if it's a pizza restaurant
      if (!place.types.includes('pizza_restaurant')) {
        return false;
      }
      
      // Check if it's within the radius
      const distance = calculateDistance(
        latitude, 
        longitude, 
        place.location.latitude, 
        place.location.longitude
      );
      return distance <= radius;
    });
    
    console.log(`Found ${nearbyPlaces.length} pizza restaurants within ${radius/1609.34} miles`);
    return nearbyPlaces.map(place => convertToPlaceResult(place));
  } catch (error) {
    console.error('Error getting nearby Brooklyn pizza places:', error);
    return [];
  }
};

// Get all available neighborhoods
export const getAllNeighborhoods = async (): Promise<string[]> => {
  try {
    const data = await loadBrooklynPizzaData();
    return data.metadata.neighborhoods;
  } catch (error) {
    console.error('Error getting neighborhoods:', error);
    return [];
  }
};

// Get pizza place details by ID
export const getPizzaPlaceById = async (id: string): Promise<PlaceResult | null> => {
  try {
    const data = await loadBrooklynPizzaData();
    const place = data.places.find(p => p.id === id);
    
    if (!place) return null;
    
    return convertToPlaceResult(place);
  } catch (error) {
    console.error(`Error getting pizza place with ID ${id}:`, error);
    return null;
  }
};
