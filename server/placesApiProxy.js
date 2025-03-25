// This is a simple Express.js server that acts as a proxy for the Google Places API
// and provides chat functionality for the PizzaRat app
// You can deploy this to a service like Vercel, Netlify Functions, or Firebase Functions

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const chatApi = require('./chatApi');
const reviewsApi = require('./reviewsApi');

// Load environment variables from .env file
dotenv.config();

const app = express();

// Get API key from environment variables
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Check if API key is available
if (!API_KEY) {
  console.error('ERROR: Google Places API key is missing!');
  console.error('Please set the GOOGLE_PLACES_API_KEY environment variable in a .env file');
  console.error('See .env.example for reference');
}

// Get allowed origins from environment variables or use defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['https://pizzarat.app', 'http://localhost:19006', 'http://localhost:19000'];

// Enable CORS for your app's domain
app.use(cors({
  origin: allowedOrigins
}));

// Parse JSON request bodies
app.use(express.json());

// Endpoint to search for nearby pizza places
app.get('/api/places/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 3218 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    const endpoint = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=restaurant&keyword=pizza&key=${API_KEY}`;
    
    const response = await axios.get(endpoint);
    
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying to Places API:', error);
    res.status(500).json({ error: 'Failed to fetch places data' });
  }
});

// Endpoint to get place details
app.get('/api/places/details', async (req, res) => {
  try {
    const { placeId } = req.query;
    
    if (!placeId) {
      return res.status(400).json({ error: 'Place ID is required' });
    }
    
    const endpoint = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,formatted_phone_number,formatted_address,opening_hours,website,price_level,review,photo&key=${API_KEY}`;
    
    const response = await axios.get(endpoint);
    
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying to Places API:', error);
    res.status(500).json({ error: 'Failed to fetch place details' });
  }
});

// Endpoint to get place photos
app.get('/api/places/photo', async (req, res) => {
  try {
    const { photoReference, maxWidth = 400 } = req.query;
    
    if (!photoReference) {
      return res.status(400).json({ error: 'Photo reference is required' });
    }
    
    const endpoint = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${API_KEY}`;
    
    // Redirect to the actual photo URL
    res.redirect(endpoint);
  } catch (error) {
    console.error('Error proxying to Places API photo:', error);
    res.status(500).json({ error: 'Failed to fetch place photo' });
  }
});

// Mount the API routes
app.use('/api/chat', chatApi);
app.use('/api/reviews', reviewsApi);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PizzaRat API server running on port ${PORT}`);
});

module.exports = app;
