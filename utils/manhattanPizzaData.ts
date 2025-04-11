import { PlaceResult } from './placesApi';

// Define the structure of our Manhattan pizza data from Grubhub
interface ManhattanPizzaPlace {
  restaurant_id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: {
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
  };
  rating?: {
    rating_bayesian10_point: number;
    rating_count: number;
  };
  cuisines: string[];
  menu_items: Array<{
    name: string;
    description: string;
  }>;
}

export interface ManhattanPizzaData {
  metadata: {
    total_places: number;
    borough: string;
    neighborhoods: string[];
  };
  places: ManhattanPizzaPlace[];
}

// Convert Manhattan pizza data to match PlaceResult format
const convertToPlaceResult = (place: ManhattanPizzaPlace): PlaceResult => { 
  return {
    "id": place.restaurant_id,
    "types": [
      "pizza_restaurant", 
    ],
    "formattedAddress": `${place.address.street_address}, ${place.address.address_locality}`,
    "location": {
      "latitude": place.address.latitude,
      "longitude": place.address.longitude
    },
    "rating": place.rating?.rating_bayesian10_point,
    "priceLevel": "PRICE_LEVEL_MODERATE",
    "userRatingCount": place.rating?.rating_count,
    "displayName": {
      "text": place.name,
      "languageCode": "en"
    },
    "neighborhood": "Greenpoint",
    "borough": "Brooklyn"
    // id: place.restaurant_id,
    // place_id: place.restaurant_id,
    // name: place.name,
    // vicinity: `${place.address.street_address}, ${place.address.city}`,
    // geometry: {
    //   location: {
    //     lat: place.address.latitude,
    //     lng: place.address.longitude
    //   }
    // },
    // rating: place.rating?.rating_bayesian10_point || 0,
    // user_ratings_total: place.rating?.rating_count || 0,
    // price_level: 2, // Default to moderate
    // photos: [],
    // types: ["pizza_restaurant"],
    // neighborhood: "Manhattan",
    // borough: "Manhattan",
    // location: {
    //   lat: place.address.latitude,
    //   lng: place.address.longitude
    // }
  };
};

// Function to load the Manhattan pizza data
export const loadManhattanPizzaData = async () => {
  try {
    const manhattan = require('../boroughs/manhattan_pizza_places.json');
    const brooklyn = require('../boroughs/brooklyn_pizza_places.json');
    const queens = require('../boroughs/queens_pizza_places.json');
    const bronx = require('../boroughs/bronx_pizza_places.json');
    const statenIsland = require('../boroughs/staten_island_pizza_places.json');
 
    const places = [...manhattan?.places || [], ...brooklyn?.places || [], ...queens?.places || [], ...bronx?.places || [],...statenIsland?.places || []]
    
    
    // Convert all places and filter out duplicates based on coordinates
    const allPlaces = places
    
    // Create a Map to store unique places using lat/lng as key
    const uniquePlaces = new Map();
  
    allPlaces.forEach(place => {
      const key = `${place.location.latitude},${place.location.longitude}`;
      // Only keep the first occurrence of a place at each coordinate
      if (!uniquePlaces.has(key)) {
        uniquePlaces.set(key, place);
      }
    });

    const convertedPlaces = Array.from(uniquePlaces.values());

    return { metadata: manhattan.metadata, places: convertedPlaces };
  } catch (error) {
    console.error('Error loading Manhattan pizza data:', error);
    throw error;
  }
};
