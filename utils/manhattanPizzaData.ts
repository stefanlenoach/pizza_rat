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
    const data1 = require('../pizza_data/manhattan/manhattan_pizzas_part_001.json');
    const data2 = require('../pizza_data/manhattan/manhattan_pizzas_part_002.json');
    const data3 = require('../pizza_data/bronx/bronx_pizzas.json'); 
    const data4 = require('../pizza_data/brooklyn/brooklyn_pizzas.json');
    const data5 = require('../pizza_data/queens/queens_pizzas.json');
    const data6 = require('../pizza_data/staten_island/state_island.json');
    
    const places = [...data1.places, ...data2.places, ...data3.places, ...data4.places, ...data5.places, ...data6.places]
    .filter((place:any) => {
      if (place.cuisines.includes('Deli')) { 
        return false;
      }
      return true;
    });

    const oldBrooklyn = require('../brooklyn_pizza_places.json');

    const brooklynData = oldBrooklyn.places.filter((place:any) => {
      if (!place.types.includes('pizza_restaurant')) {
        return false;
      }
      return true;
    })
 
    // Convert all places and filter out duplicates based on coordinates
    const allPlaces = places.map(convertToPlaceResult).concat(brooklynData);
    
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

    return { metadata: data1.metadata, places: convertedPlaces };
  } catch (error) {
    console.error('Error loading Manhattan pizza data:', error);
    throw error;
  }
};
