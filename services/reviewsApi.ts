/**
 * Reviews API service for the PizzaRat app
 * This service handles communication with the reviews API endpoints
 */

import Constants from 'expo-constants';

// Base URL for API requests
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';

// Types
export interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
}

export interface Review {
  id: string;
  content: string;
  photos: string[];
  rating: number;
  userId: string;
  placeId: string;
  createdAt: string;
  user: User;
}

// API functions
export const reviewsApi = {
  /**
   * Get reviews for a place or user
   */
  getReviews: async (params: { placeId?: string; userId?: string }): Promise<Review[]> => {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      if (params.placeId) queryParams.append('placeId', params.placeId);
      if (params.userId) queryParams.append('userId', params.userId);
      
      // Make the API request
      const response = await fetch(`${API_BASE_URL}/reviews?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching reviews: ${response.status}`);
      }
      
      const data = await response.json();
      return data.reviews;
    } catch (error) {
      console.error('Error in getReviews:', error);
      return [];
    }
  },
  
  /**
   * Get a specific review by ID
   */
  getReview: async (id: string): Promise<Review | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${id}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching review: ${response.status}`);
      }
      
      const data = await response.json();
      return data.review;
    } catch (error) {
      console.error('Error in getReview:', error);
      return null;
    }
  },
  
  /**
   * Create a new review
   */
  createReview: async (review: {
    userId: string;
    placeId: string;
    content: string;
    photos?: string[];
    rating: number;
  }): Promise<Review | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(review),
      });
      
      if (!response.ok) {
        throw new Error(`Error creating review: ${response.status}`);
      }
      
      const data = await response.json();
      return data.review;
    } catch (error) {
      console.error('Error in createReview:', error);
      return null;
    }
  },
  
  /**
   * Delete a review
   */
  deleteReview: async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting review: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error in deleteReview:', error);
      return false;
    }
  },
};

export default reviewsApi;
