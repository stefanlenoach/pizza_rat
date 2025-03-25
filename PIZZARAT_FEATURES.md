# 🍕 Pizzarat App - Feature & Component Checklist

## Overview
Pizzarat is a React Native mobile app that helps users discover, rate, and comment on pizza places near them. Although initially focusing on New York City, the app is designed to work anywhere.

## 🛠️ Tech Stack
- Frontend: Expo React Native with Tailwind CSS
- Backend: Node.js with Express (or NestJS)
- Database: PostgreSQL with Prisma ORM
- Map Integration: Google Maps API
- Authentication: Firebase Auth

## 📱 Frontend Features & Components

### 🗺️ Map & Location Features
- [ ] Interactive Google Map showing nearby pizza places
- [ ] Geolocation service to detect user's current location
- [ ] Map filters (rating, distance, price, etc.)
- [ ] Pizza place markers with preview information
- [ ] "Near me" functionality with adjustable radius

### 🍕 Pizza Place Details
- [ ] Detailed view for each pizza restaurant
- [ ] Photo gallery of the restaurant and pizzas
- [ ] Menu information (if available)
- [ ] Business hours and contact information
- [ ] Directions to the restaurant

### ⭐ Rating & Review System
- [ ] Simple 0-10 rating system (with one decimal precision)
- [ ] User reviews/comments section
- [ ] Upvote/downvote on reviews

### 👤 User Profiles
- [ ] User registration and authentication
- [ ] Profile customization
- [ ] Review history
- [ ] Favorite pizza places
- [ ] Achievement/badges system (pizza connoisseur, etc.)

### 📱 UI Components
- [ ] Bottom navigation bar
- [ ] Search functionality with autocomplete
- [ ] Filter modal
- [ ] Location permission request screen
- [ ] Loading states and skeleton screens
- [ ] Error handling UI components
- [ ] Dark/light mode support

## 🖥️ Backend Features & Components

### 🗄️ API Endpoints
- [ ] User authentication routes
- [ ] Pizza place CRUD operations
- [ ] Rating and review endpoints
- [ ] User profile management
- [ ] Search and filter endpoints

### 🔐 Authentication & Authorization
- [ ] JWT-based authentication
- [ ] Role-based access control
- [ ] Password reset functionality
- [ ] Social media login integration

### 📊 Database Schema (Prisma)

```prisma
// This is a starting point for the Prisma schema

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  profileImage  String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  reviews       Review[]
  favorites     Favorite[]
}

model PizzaPlace {
  id            String    @id @default(cuid())
  name          String
  address       String
  city          String
  state         String?
  zipCode       String?
  country       String    @default("USA")
  phone         String?
  website       String?
  googlePlaceId String?   @unique
  latitude      Float
  longitude     Float
  priceLevel    Int?      // 1-4 representing $-$$$$
  openHours     Json?     // Store as JSON object
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  reviews       Review[]
  photos        Photo[]
  favorites     Favorite[]
}

model Review {
  id            String     @id @default(cuid())
  rating        Float      // 0-10 score with one decimal precision
  comment       String?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  userId        String
  user          User       @relation(fields: [userId], references: [id])
  pizzaPlaceId  String
  pizzaPlace    PizzaPlace @relation(fields: [pizzaPlaceId], references: [id])
  likes         Int        @default(0)
  dislikes      Int        @default(0)
}

model Favorite {
  id            String     @id @default(cuid())
  userId        String
  user          User       @relation(fields: [userId], references: [id])
  pizzaPlaceId  String
  pizzaPlace    PizzaPlace @relation(fields: [pizzaPlaceId], references: [id])
  createdAt     DateTime   @default(now())

  @@unique([userId, pizzaPlaceId])
}
```

## 🔌 API Integrations

### 🗺️ Google Maps API
- [ ] Maps JavaScript API for displaying the map
- [ ] Places API for pizza restaurant data
- [ ] Geocoding API for address/location conversion
- [ ] Distance Matrix API for calculating distances

### 📱 Firebase Integration
- [ ] Firebase Authentication
- [ ] Firebase Cloud Messaging for notifications
- [ ] Firebase Storage for image uploads

## 📲 App Features Implementation Phases

### Phase 1: MVP
- [ ] Basic map showing hardcoded pizza places
- [ ] Simple detail view for restaurants
- [ ] User authentication
- [ ] Basic rating system

### Phase 2: Enhanced Features
- [ ] Full review system with comments
- [ ] User profiles
- [ ] Favorites and history
- [ ] Simplified rating display

### Phase 3: Advanced Features
- [ ] Social features (sharing, following users)
- [ ] Achievement system
- [ ] Personalized recommendations
- [ ] Offline support

## 🧪 Testing Strategy
- [ ] Unit testing for components and services
- [ ] Integration testing for API endpoints
- [ ] E2E testing with Detox
- [ ] User testing with TestFlight/Google Play beta

## 📱 Deployment Checklist
- [ ] App Store optimization
- [ ] Privacy policy and terms of service
- [ ] Analytics integration
- [ ] Crash reporting
- [ ] CI/CD pipeline setup

## 📝 Notes
- Yes, Google Places API can be used to find all local pizza restaurants! The Places API allows you to search for places by type (like "restaurant" or more specifically "pizza"), within a specified radius from a location.
- For best performance, we might want to cache some pizza place data locally rather than hitting the Google API for every request.
- Consider implementing a moderation system for reviews to prevent spam or inappropriate content.
