// Mock data for pizza places in New York City
// This is used for development when the Google Places API is not available

export interface MockPlaceResult {
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
  place_id: string;
  price_level?: number;
  opening_hours?: {
    open_now: boolean;
  };
  types?: string[];
}

// Sample pizza places in NYC
export const mockPizzaPlaces: MockPlaceResult[] = [
  {
    id: "1",
    name: "Joe's Pizza",
    vicinity: "7 Carmine St, New York",
    geometry: {
      location: {
        lat: 40.730488,
        lng: -74.002069
      }
    },
    rating: 4.7,
    user_ratings_total: 5423,
    place_id: "ChIJCXNI2uxZwokRXVV3Hn8gKzU",
    price_level: 1,
    opening_hours: {
      open_now: true
    },
    types: ["pizza_restaurant", "restaurant", "food"]
  },
  {
    id: "2",
    name: "Lombardi's Pizza",
    vicinity: "32 Spring St, New York",
    geometry: {
      location: {
        lat: 40.721552,
        lng: -73.995580
      }
    },
    rating: 4.5,
    user_ratings_total: 4832,
    place_id: "ChIJtxZRX3VZwokRp1ZGS_Kscb0",
    price_level: 2,
    opening_hours: {
      open_now: true
    },
    types: ["pizza_restaurant", "restaurant", "food"]
  },
  {
    id: "3",
    name: "Artichoke Basille's Pizza",
    vicinity: "111 MacDougal St, New York",
    geometry: {
      location: {
        lat: 40.729901,
        lng: -74.000790
      }
    },
    rating: 4.3,
    user_ratings_total: 2345,
    place_id: "ChIJG_bw-pNZwokRPOlRbj8vQVc",
    price_level: 1,
    opening_hours: {
      open_now: true
    },
    types: ["pizza_restaurant", "restaurant", "food"]
  },
  {
    id: "4",
    name: "Prince Street Pizza",
    vicinity: "27 Prince St, New York",
    geometry: {
      location: {
        lat: 40.722866,
        lng: -73.994405
      }
    },
    rating: 4.8,
    user_ratings_total: 3987,
    place_id: "ChIJT2Y6Qn1ZwokRQsZ2Lav_AB0",
    price_level: 1,
    opening_hours: {
      open_now: true
    },
    types: ["pizza_restaurant", "restaurant", "food"]
  },
  {
    id: "5",
    name: "John's of Bleecker Street",
    vicinity: "278 Bleecker St, New York",
    geometry: {
      location: {
        lat: 40.731706,
        lng: -74.003255
      }
    },
    rating: 4.6,
    user_ratings_total: 3256,
    place_id: "ChIJN8Z5i5JZwokRZaM3BgZ9_Y8",
    price_level: 2,
    opening_hours: {
      open_now: true
    },
    types: ["pizza_restaurant", "restaurant", "food"]
  },
  {
    id: "6",
    name: "Di Fara Pizza",
    vicinity: "1424 Avenue J, Brooklyn",
    geometry: {
      location: {
        lat: 40.625220,
        lng: -73.961571
      }
    },
    rating: 4.7,
    user_ratings_total: 2987,
    place_id: "ChIJmZ9c1KJbwokRNFu2sbLnYRE",
    price_level: 2,
    opening_hours: {
      open_now: true
    },
    types: ["pizza_restaurant", "restaurant", "food"]
  },
  {
    id: "7",
    name: "Roberta's",
    vicinity: "261 Moore St, Brooklyn",
    geometry: {
      location: {
        lat: 40.705089,
        lng: -73.933585
      }
    },
    rating: 4.6,
    user_ratings_total: 3421,
    place_id: "ChIJN5U4LQBcwokR7S4Aio5DnpQ",
    price_level: 2,
    opening_hours: {
      open_now: true
    },
    types: ["pizza_restaurant", "restaurant", "food"]
  },
  {
    id: "8",
    name: "Patsy's Pizzeria",
    vicinity: "2287 1st Avenue, New York",
    geometry: {
      location: {
        lat: 40.802448,
        lng: -73.937447
      }
    },
    rating: 4.5,
    user_ratings_total: 1987,
    place_id: "ChIJGzfjmYX2wokRQUc4Vn8H-uA",
    price_level: 2,
    opening_hours: {
      open_now: true
    },
    types: ["pizza_restaurant", "restaurant", "food"]
  },
  {
    id: "9",
    name: "Jovans's Pizza",
    vicinity: "Ada Bohol, Philippines",
    geometry: {
      location: {
        lat: 9.757693916416223,
        lng: 124.5766902254247
      }
    },
    rating: 4.5,
    user_ratings_total: 1987,
    place_id: "",
    price_level: 2,
    opening_hours: {
      open_now: true
    },
    types: ["pizza_restaurant", "restaurant", "food"]
  }
];
