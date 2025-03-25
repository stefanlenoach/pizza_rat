/**
 * API service for interacting with the Pizzarat backend
 */

import Constants from 'expo-constants';

// Base URL for API requests
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';

// Types
export interface PizzaPlace {
  id: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  zipCode?: string;
  country: string;
  phone?: string;
  website?: string;
  googlePlaceId?: string;
  latitude: number;
  longitude: number;
  description?: string;
  hours?: Record<string, any>;
  photos: string[];
  avgRating?: number;
  numRatings: number;
  _count?: {
    reviews: number;
    ratings: number;
  };
}

export interface User {
  id: string;
  username: string;
  name?: string;
  avatar?: string;
}

export interface Review {
  id: string;
  createdAt: string;
  updatedAt: string;
  content: string;
  photos: string[];
  userId: string;
  placeId: string;
  user?: User;
}

export interface Rating {
  id: string;
  createdAt: string;
  updatedAt: string;
  value: number;
  userId: string;
  placeId: string;
  user?: User;
}

// API functions
export const api = {
  /**
   * Get pizza places, optionally filtered by location and radius
   */
  getPizzaPlaces: async (lat?: number, lng?: number, radius?: number): Promise<PizzaPlace[]> => {
    try {
      let url = `${API_BASE_URL}/pizza-places`;
      
      // Add query parameters if provided
      const params = new URLSearchParams();
      if (lat) params.append('lat', lat.toString());
      if (lng) params.append('lng', lng.toString());
      if (radius) params.append('radius', radius.toString());
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pizza places: ${response.status}`);
      }
      
      const data = await response.json();
      return data.places;
    } catch (error) {
      console.error('Error fetching pizza places:', error);
      throw error;
    }
  },
  
  /**
   * Get a single pizza place by ID
   */
  getPizzaPlace: async (id: string): Promise<PizzaPlace> => {
    try {
      const response = await fetch(`${API_BASE_URL}/pizza-places/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pizza place: ${response.status}`);
      }
      
      const data = await response.json();
      return data.place;
    } catch (error) {
      console.error(`Error fetching pizza place ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new pizza place
   */
  createPizzaPlace: async (placeData: Partial<PizzaPlace>): Promise<PizzaPlace> => {
    try {
      const response = await fetch(`${API_BASE_URL}/pizza-places`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(placeData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create pizza place: ${response.status}`);
      }
      
      const data = await response.json();
      return data.place;
    } catch (error) {
      console.error('Error creating pizza place:', error);
      throw error;
    }
  },
  
  /**
   * Get reviews for a pizza place
   */
  getReviews: async (placeId?: string, userId?: string): Promise<Review[]> => {
    try {
      let url = `${API_BASE_URL}/reviews`;
      
      // Add query parameters if provided
      const params = new URLSearchParams();
      if (placeId) params.append('placeId', placeId);
      if (userId) params.append('userId', userId);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.status}`);
      }
      
      const data = await response.json();
      return data.reviews;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  },
  
  /**
   * Create a new review
   */
  createReview: async (reviewData: {
    content: string;
    photos?: string[];
    userId: string;
    placeId: string;
  }): Promise<Review> => {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create review: ${response.status}`);
      }
      
      const data = await response.json();
      return data.review;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  },
  
  /**
   * Get ratings for a pizza place
   */
  getRatings: async (placeId?: string, userId?: string): Promise<Rating[]> => {
    try {
      let url = `${API_BASE_URL}/ratings`;
      
      // Add query parameters if provided
      const params = new URLSearchParams();
      if (placeId) params.append('placeId', placeId);
      if (userId) params.append('userId', userId);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ratings: ${response.status}`);
      }
      
      const data = await response.json();
      return data.ratings;
    } catch (error) {
      console.error('Error fetching ratings:', error);
      throw error;
    }
  },
  
  /**
   * Create or update a rating
   * Note: The value should be on the 0-10 scale used in the UI
   */
  ratePlace: async (ratingData: {
    value: number; // 0-10 scale
    userId: string;
    placeId: string;
  }): Promise<Rating> => {
    try {
      const response = await fetch(`${API_BASE_URL}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ratingData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create/update rating: ${response.status}`);
      }
      
      const data = await response.json();
      return data.rating;
    } catch (error) {
      console.error('Error creating/updating rating:', error);
      throw error;
    }
  },
  
  /**
   * Convert a Google Places result to our PizzaPlace format
   */
  convertGooglePlaceToDbFormat: (googlePlace: any): Partial<PizzaPlace> => {
    return {
      name: googlePlace.name,
      address: googlePlace.vicinity || googlePlace.formatted_address,
      city: googlePlace.city || '', // Would need to parse from address
      state: googlePlace.state || '', // Would need to parse from address
      googlePlaceId: googlePlace.place_id,
      latitude: googlePlace.geometry.location.lat,
      longitude: googlePlace.geometry.location.lng,
      photos: googlePlace.photos?.map((p: any) => p.photo_reference) || [],
    };
  }
};

export default api;
