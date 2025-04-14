import { PlaceResult } from './placesApi';
import { loadManhattanPizzaData } from './manhattanPizzaData';
import { NeighborhoodData, parseNeighborhoodData, isPointInPolygon, filterPlacesByNeighborhood } from './neighborhoodUtils';

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

// Load the neighborhood boundaries from the GeoJSON file
let neighborhoodBoundaries: NeighborhoodData[] = [];

export const loadNeighborhoodBoundaries = async (): Promise<NeighborhoodData[]> => {
  if (neighborhoodBoundaries.length > 0) {
    return neighborhoodBoundaries;
  }

  try {
    const data = require('../neighborhood_data/nyc_neighborhood.json');
    neighborhoodBoundaries = parseNeighborhoodData(data);
    return neighborhoodBoundaries;
  } catch (error) {
    console.error('Error loading neighborhood boundaries:', error);
    return [];
  }
};

// Function to load the Brooklyn pizza data
export const loadBrooklynPizzaData = async (): Promise<BrooklynPizzaData> => {
  try { 
    const manhattanData = await loadManhattanPizzaData();
  
    // Load neighborhood boundaries if not already loaded
    if (neighborhoodBoundaries.length === 0) {
      await loadNeighborhoodBoundaries();
    }
    
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
    rating: place.rating || 0,
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
export const getPizzaPlacesByNeighborhood = async (neighborhoodName: string): Promise<PlaceResult[]> => {
  try {
    // Ensure neighborhood boundaries are loaded
    if (neighborhoodBoundaries.length === 0) {
      await loadNeighborhoodBoundaries();
    }
    
    // Find the selected neighborhood
    const neighborhood = neighborhoodBoundaries.find(n => n.name === neighborhoodName);
    if (!neighborhood) {
      console.error(`Neighborhood ${neighborhoodName} not found`);
      return [];
    }
    
    // Get all pizza places
    const allPlaces = await getAllBrooklynPizzaPlaces();
    
    // Filter places by the selected neighborhood
    return filterPlacesByNeighborhood(allPlaces, neighborhood);
  } catch (error) {
    console.error(`Error getting pizza places in ${neighborhoodName}:`, error);
    return [];
  }
};

// Get pizza places near a location with a specified radius (in meters)
export const getNearbyBrooklynPizzaPlaces = async (
  latitude: number, 
  longitude: number, 
  radius: number = 3218, // Default to 2 miles
  setAllPlaces?: (places: PlaceResult[]) => void,
  neighborhoodFilter?: string // Add neighborhood filter parameter
): Promise<PlaceResult[]> => {
  try {
    const data = await loadBrooklynPizzaData();
    
    // Ensure neighborhood boundaries are loaded
    if (neighborhoodBoundaries.length === 0) {
      await loadNeighborhoodBoundaries();
    }
    
    const pizzaRestaurants = data.places.filter(place => 
      place.types.includes('pizza_restaurant')
    );
    
    let allPlaces = pizzaRestaurants.map(place => convertToPlaceResult(place));
    
    if (setAllPlaces) {
      setAllPlaces(allPlaces);
    }
    
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
    
    // Filter places within the radius
    let nearbyPlaces = allPlaces.filter(place => {
      const distance = calculateDistance(
        latitude, 
        longitude, 
        place.geometry.location.lat, 
        place.geometry.location.lng
      );
      return distance <= radius;
    });
    
    // Apply neighborhood filter if provided
    if (neighborhoodFilter && neighborhoodFilter !== 'all') {
      const neighborhood = neighborhoodBoundaries.find(n => n.name === neighborhoodFilter);
      if (neighborhood) {
        nearbyPlaces = filterPlacesByNeighborhood(nearbyPlaces, neighborhood);
      }
    }
    
    console.log(`Found ${nearbyPlaces.length} pizza restaurants within ${radius/1609.34} miles`);
    
    return nearbyPlaces;
  } catch (error) {
    console.error('Error getting nearby Brooklyn pizza places:', error);
    return [];
  }
};

// Get all available neighborhoods
export const getAllNeighborhoods = async (): Promise<string[]> => {
  try {
    // Ensure neighborhood boundaries are loaded
    if (neighborhoodBoundaries.length === 0) {
      await loadNeighborhoodBoundaries();
    }
    
    return neighborhoodBoundaries.map(n => n.name);
  } catch (error) {
    console.error('Error getting neighborhoods:', error);
    return [];
  }
};

// Get neighborhood boundaries for a specific neighborhood
export const getNeighborhoodBoundary = async (neighborhoodName: string): Promise<NeighborhoodData | null> => {
  try {
    // Ensure neighborhood boundaries are loaded
    if (neighborhoodBoundaries.length === 0) {
      await loadNeighborhoodBoundaries();
    }
    
    const neighborhood = neighborhoodBoundaries.find(n => n.name === neighborhoodName);
    return neighborhood || null;
  } catch (error) {
    console.error(`Error getting boundary for ${neighborhoodName}:`, error);
    return null;
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