/**
 * Reviews API for the PizzaRat app
 * This file provides endpoints for managing pizza place reviews
 */

const express = require('express');
const router = express.Router();

// Mock data for reviews (would normally come from a database)
const REVIEWS = [
  {
    id: '1',
    content: 'Best pizza in NYC! The crust is perfectly thin and crispy.',
    photos: ['https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300&auto=format&fit=crop'],
    rating: 5,
    userId: 'user123',
    placeId: 'ChIJR7oPqIVZwokR4S5vbmHLgkY',
    createdAt: '2025-03-20T15:30:00Z',
    user: {
      id: 'user123',
      username: 'pizzalover',
      name: 'John Doe',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop'
    }
  },
  {
    id: '2',
    content: 'Decent pizza but a bit overpriced for what you get.',
    photos: [],
    rating: 3,
    userId: 'user456',
    placeId: 'ChIJR7oPqIVZwokR4S5vbmHLgkY',
    createdAt: '2025-03-18T12:15:00Z',
    user: {
      id: 'user456',
      username: 'pizzacritic',
      name: 'Jane Smith',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop'
    }
  },
  {
    id: '3',
    content: 'Amazing authentic Neapolitan style pizza! Will definitely be back.',
    photos: ['https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=300&auto=format&fit=crop'],
    rating: 5,
    userId: 'user789',
    placeId: 'ChIJK3vMgYVZwokRHcHrfQdx0mQ',
    createdAt: '2025-03-15T18:45:00Z',
    user: {
      id: 'user789',
      username: 'foodie123',
      name: 'Mike Johnson',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop'
    }
  }
];

/**
 * GET /api/reviews
 * Get reviews with optional filtering by placeId or userId
 */
router.get('/', (req, res) => {
  try {
    const { placeId, userId } = req.query;
    
    // Filter reviews based on query parameters
    let filteredReviews = [...REVIEWS];
    
    if (placeId) {
      filteredReviews = filteredReviews.filter(review => review.placeId === placeId);
    }
    
    if (userId) {
      filteredReviews = filteredReviews.filter(review => review.userId === userId);
    }
    
    // Sort by most recent
    filteredReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ reviews: filteredReviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

/**
 * POST /api/reviews
 * Create a new review
 */
router.post('/', (req, res) => {
  try {
    const { userId, placeId, content, photos, rating } = req.body;
    
    // Validate required fields
    if (!userId || !placeId || !content || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create a new review
    const newReview = {
      id: Date.now().toString(),
      content,
      photos: photos || [],
      rating,
      userId,
      placeId,
      createdAt: new Date().toISOString(),
      // In a real app, we would fetch user data from the database
      // For now, we'll use mock data
      user: {
        id: userId,
        username: 'currentuser',
        name: 'Current User',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop'
      }
    };
    
    // Add to our mock database
    REVIEWS.unshift(newReview);
    
    res.status(201).json({ review: newReview });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

/**
 * GET /api/reviews/:id
 * Get a specific review by ID
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const review = REVIEWS.find(r => r.id === id);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json({ review });
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

/**
 * DELETE /api/reviews/:id
 * Delete a review
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const reviewIndex = REVIEWS.findIndex(r => r.id === id);
    
    if (reviewIndex === -1) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    // Remove the review from our mock database
    REVIEWS.splice(reviewIndex, 1);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router;
