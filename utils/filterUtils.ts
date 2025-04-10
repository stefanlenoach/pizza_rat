import { cloneDeep } from 'lodash';
import { PlaceResult } from './placesApi';
import * as Location from 'expo-location';

// Borough boundaries (approximate)
type Borough = 'brooklyn' | 'bronx' | 'staten_island' | 'queens' | 'manhattan';

interface BoroughBoundary {
  lat: { min: number; max: number };
  lng: { min: number; max: number };
}

const BOROUGH_BOUNDARIES: Record<Borough, BoroughBoundary> = {
  brooklyn: {
    lat: { min: 40.56, max: 40.74 },
    lng: { min: -74.04, max: -73.83 }
  },
  bronx: {
    lat: { min: 40.78, max: 40.92 },
    lng: { min: -73.94, max: -73.76 }
  },
  staten_island: {
    lat: { min: 40.49, max: 40.65 },
    lng: { min: -74.26, max: -74.04 }
  },
  queens: {
    lat: { min: 40.54, max: 40.80 },
    lng: { min: -73.96, max: -73.70 }
  },
  manhattan: {
    lat: { min: 40.68, max: 40.88 },
    lng: { min: -74.03, max: -73.90 }
  }
};

// Function to calculate distance between two coordinates
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

// Function to check if a place is in a specific borough
const isInBorough = (place: PlaceResult, borough: string): boolean => {
  if (!(borough in BOROUGH_BOUNDARIES)) return false;
  
  const { lat, lng } = place.geometry.location;
  const bounds = BOROUGH_BOUNDARIES[borough as Borough];
  
  return (
    lat >= bounds.lat.min &&
    lat <= bounds.lat.max &&
    lng >= bounds.lng.min &&
    lng <= bounds.lng.max
  );
};

// Main filter function
export const filterPizzaPlaces = async (
  places: PlaceResult[],
  sortFilter: string,
  locationFilter: string,
  userLocation: Location.LocationObject | null 
): Promise<PlaceResult[]> => {
  let filteredPlaces = cloneDeep([...places]);
 
  // Apply location filter
  if (locationFilter !== 'all_nyc') {
    if (locationFilter === 'near_me') {
      // For "near me", we don't filter out places, but we'll sort by distance later
    } else {
      // Filter by borough
      filteredPlaces = filteredPlaces.filter(place => 
        isInBorough(place, locationFilter)
      );
    }
  }
  
  // Apply sort filter
  switch (sortFilter) {
    case 'best':
      const withRatings = filteredPlaces.filter(a => (a.rating || 0) > 0)
      withRatings.sort((a, b) => (b.rating || 0) - (a.rating || 0)); // Sort descending
      filteredPlaces = withRatings
      break;
    case 'worst':
      const withRatings2 = filteredPlaces.filter(a => (a.rating || 0) > 0)
      withRatings2.sort((a, b) => (a.rating || 0) - (b.rating || 0)); // Sort descending 
      if(withRatings2.length == 1){
        filteredPlaces = []
      } else {
        filteredPlaces = withRatings2 
      }
      break; 
    case 'cheap': 
      filteredPlaces = filteredPlaces.filter(a => (a.price_level || 0) <= 3)
      break;
    case 'popular':
      const withRatings3 = filteredPlaces.filter(a => (a.rating || 0) > 0) 
      filteredPlaces = withRatings3.filter(a => (a.totalReviews || 0) > 0).sort((a, b) => (b.rating || 0) - (a.rating || 0))
      break;
    default:
      break;
  }
  
  // If "near_me" is selected, sort by distance to user
  if (locationFilter === 'near_me' && userLocation) {
    const { latitude, longitude } = userLocation.coords;
    
    // Calculate distance for each place
    const placesWithDistance = filteredPlaces.map(place => {
      const distance = calculateDistance(
        latitude,
        longitude,
        place.geometry.location.lat,
        place.geometry.location.lng
      );
      return { ...place, distance };
    });
    
    // Sort by distance
    placesWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
    // Remove the distance property before returning
    filteredPlaces = placesWithDistance.map(({ distance, ...place }) => place);
  }
  
  return filteredPlaces;
};
