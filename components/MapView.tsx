import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, Platform, TouchableOpacity, Animated, AppState } from 'react-native';
import { Text } from '@/components/CustomText';
import MapView, { Marker, Region, Callout, Circle, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import tw from '@/utils/tw';
import { searchNearbyPizzaPlaces, PlaceResult } from '@/utils/placesApi';
import { filterPizzaPlaces } from '@/utils/filterUtils';
import PizzaMarker from './PizzaMarker';
import PizzaPlaceBottomSheet from './PizzaPlaceBottomSheet';
import SearchModal from './SearchModal';
import FilterBottomSheet from './FilterBottomSheet';
import { 
  getAllBrooklynPizzaPlaces, 
  getNearbyBrooklynPizzaPlaces, 
  getNeighborhoodBoundary,
  getAllNeighborhoods,
  loadNeighborhoodBoundaries
} from '@/utils/brooklynPizzaData';
import { 
  NeighborhoodData, 
  calculateNeighborhoodRegion,
  isPointInPolygon
} from '@/utils/neighborhoodUtils';
import { supabase } from '@/lib/supabase';
import { useUser } from "@/contexts/UserContext";
import { Ionicons } from '@expo/vector-icons';
import { FilterType } from '@/app/(tabs)/_layout';

// Default coordinates for New York City (Manhattan)
const NEW_YORK_COORDS: Region = {
  latitude: 40.7128,
  longitude: -74.0060,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// Brooklyn coordinates
const BROOKLYN_COORDS: Region = {
  latitude: 40.6782,
  longitude: -73.9442,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

// Predefined regions for each borough
const BOROUGH_REGIONS = {
  all_nyc: {
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 0.3,
    longitudeDelta: 0.3,
  },
  brooklyn: {
    latitude: 40.6782,
    longitude: -73.9442,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  },
  manhattan: {
    latitude: 40.7831,
    longitude: -73.9712,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  },
  queens: {
    latitude: 40.7282,
    longitude: -73.7949,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  },
  bronx: {
    latitude: 40.8448,
    longitude: -73.8648,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  },
  staten_island: {
    latitude: 40.5795,
    longitude: -74.1502,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  }
};

interface PizzaMapViewProps {
  sortFilter: string;
  locationFilter: string;
  neighborhoodFilter?: string;
  onFilterChange: (filterType: keyof FilterType, value: string) => void;
}

export default function PizzaMapView({ sortFilter, locationFilter, neighborhoodFilter, onFilterChange }: PizzaMapViewProps) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [region, setRegion] = useState<Region>(NEW_YORK_COORDS);
  const [isLoading, setIsLoading] = useState(true);
  const [allPizzaPlaces, setAllPizzaPlaces] = useState<PlaceResult[]>([]);
  const [filteredPizzaPlaces, setFilteredPizzaPlaces] = useState<PlaceResult[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [selectedSearchPlace, setSelectedSearchPlace] = useState<PlaceResult | null>(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [isBrooklynMode, setIsBrooklynMode] = useState(false); 
  const [lastKnownRegion, setLastKnownRegion] = useState<Region | null>(null);
  const { placeReviews, searchModalVisible, setSearchModalVisible,filterVisible,setFilterVisible } = useUser();
  const [allPlaces, setAllPlaces] = useState<PlaceResult[]>([]);
  
  // Add state for neighborhood data
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodData[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<NeighborhoodData | null>(null);

  // Add state for current neighborhood
  const [currentNeighborhood, setCurrentNeighborhood] = useState<NeighborhoodData | null>(null);

  //for neighborhood filter
  const [neighborhoodOptions, setNeighborhoodOptions] = useState<{label: string, value: string}[]>([
    { label: 'All Neighborhoods', value: 'all' }
  ]);
  const [showNeighborhoodFilter, setShowNeighborhoodFilter] = useState(false); 

  const [showSearchThisArea, setShowSearchThisArea] = useState(false);
  const [lastSearchRegion, setLastSearchRegion] = useState<Region | null>(null);
  const mapRef = useRef<MapView | null>(null);
  
  // For debouncing map movements
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mapMovementOngoing = useRef(false);

  const [userReviewedPlaces, setUserReviewedPlaces] = useState<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  // State for other users in the neighborhood
  const [nearbyUsers, setNearbyUsers] = useState<Array<{
    id: string;
    latitude: number;
    longitude: number;
    last_updated: string;
  }>>([]);

  // Update user's location in Supabase
  const updateUserLocation = async (lat: number, lng: number, neighborhood: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from('UserLocation')
        .upsert({
          user_id: session.user.id,
          neighborhood,
          latitude: lat,
          longitude: lng,
          is_active: true,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating location:', error);
      }
    } catch (error) {
      console.error('Error in updateUserLocation:', error);
    }
  };

  // Fetch nearby users in the same neighborhood
  const fetchNearbyUsers = async (neighborhood: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // First get the neighborhood data
      const selectedNeighborhood = neighborhoods.find(n => n.name === neighborhood);
      if (!selectedNeighborhood) {
        console.log('Neighborhood not found:', neighborhood);
        return;
      }

      const { data, error } = await supabase
        .from('UserLocation')
        .select('id, latitude, longitude, last_updated')
        .eq('neighborhood', neighborhood)
        .eq('is_active', true)
        .neq('user_id', session.user.id)
        // Only show users who have updated their location in the last 5 minutes
        .gt('last_updated', new Date(Date.now() - 5 * 60 * 1000).toISOString());

      if (error) {
        console.error('Error fetching nearby users:', error);
        return;
      }

      console.log("data",data)

      // Filter users to ensure they are within the neighborhood boundaries
      const filteredUsers = (data || []).filter(user => {
        const userPlace: PlaceResult = {
          id: user.id,
          place_id: user.id,
          name: 'Nearby User',
          vicinity: neighborhood,
          geometry: {
            location: {
              lat: user.latitude,
              lng: user.longitude
            }
          }
        };
        return isPlaceInNeighborhood(userPlace, selectedNeighborhood);
      });

      console.log("filteredUsers",filteredUsers)

      setNearbyUsers([...filteredUsers]);
    } catch (error) {
      console.error('Error in fetchNearbyUsers:', error);
    }
  };

  // Update location when neighborhood changes
  useEffect(() => {
    if (location && currentNeighborhood) {
      updateUserLocation(
        location.coords.latitude,
        location.coords.longitude,
        currentNeighborhood.name
      );
      
      // Initial fetch of nearby users
      fetchNearbyUsers(currentNeighborhood.name);
      
      // Subscribe to realtime updates for UserLocation table
      const channel = supabase
        .channel('user-locations')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'UserLocation',
            
          },
          async (payload) => {
            console.log('Realtime update:', payload);
            // Fetch all nearby users again when there's any change
            await fetchNearbyUsers(currentNeighborhood.name);
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);
        });

      // Also listen for changes in user active state
      const activeStateChannel = supabase
        .channel('active-state-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'UserLocation',
            filter: `neighborhood=eq.${currentNeighborhood.name} AND is_active=eq.false`,
          },
          async (payload) => {
            console.log('User active state changed:', payload);
            // Remove inactive users immediately
            setNearbyUsers(current => 
              current.filter(user => user.id !== payload.old.id)
            );
          }
        )
        .subscribe((status) => {
          console.log('Active state subscription status:', status);
        });

      // Cleanup subscription when component unmounts or neighborhood changes
      return () => {
        channel.unsubscribe();
        activeStateChannel.unsubscribe();
      };
    }
  }, [location?.coords, currentNeighborhood]); 

  // Load user's reviewed places
  useEffect(() => {
    const loadUserReviews = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: reviewData } = await supabase
          .from('Review')
          .select('placeId')
          .eq('userId', session.user.id);

        if (reviewData) {
          setUserReviewedPlaces(new Set(reviewData.map((review: { placeId: string }) => review.placeId)));
        }
      } catch (error) {
        console.error('Error loading user reviews:', error);
      }
    };

    loadUserReviews();
  }, []);

  // Load neighborhoods data
  useEffect(() => {
    const loadNeighborhoods = async () => {
      try {
        // Load neighborhood boundaries
        const boundaries = await loadNeighborhoodBoundaries();
        setNeighborhoods(boundaries);
        console.log("Loaded neighborhoods:", boundaries.length);
        
        // Update neighborhood options
        const newOptions = [
          { label: 'All Neighborhoods', value: 'all' },
          ...boundaries.map((n: NeighborhoodData) => ({
            label: n.name,
            value: n.name
          }))
        ];
        setNeighborhoodOptions(newOptions);
      } catch (error) {
        console.error('Error loading neighborhoods:', error);
      }
    };
    
    loadNeighborhoods();
  }, []);

  // Add useEffect to detect current neighborhood based on location
  useEffect(() => {
    console.log("Location:", location?.coords);
    console.log("Number of neighborhoods:", neighborhoods.length);
    
    if (location && neighborhoods.length > 0) {
      const userLat = location.coords.latitude;
      const userLng = location.coords.longitude;
      
      console.log("User location:", { userLat, userLng });
      
      // Try to find neighborhood by checking if point is inside any polygon first
      const point: [number, number] = [userLng, userLat];
      let foundNeighborhood: NeighborhoodData | undefined = neighborhoods.find((n: NeighborhoodData) => {
        try {
          // Each neighborhood's coordinates is an array of polygons
          // Each polygon is an array of [lng, lat] points
          return n.coordinates.some(polygon => {
            return isPointInPolygon(point, polygon);
          });
        } catch (error) {
          console.error(`Error checking neighborhood ${n.name}:`, error);
          return false;
        }
      });

      // If no exact match found, find closest neighborhood
      if (!foundNeighborhood) {
        console.log("No exact match found, finding closest neighborhood...");
        let minDistance = Infinity;
        
        neighborhoods.forEach((n: NeighborhoodData) => {
          // Use the first point of the first polygon as reference
          const firstPolygon = n.coordinates[0];
          if (!firstPolygon?.length) return;
          
          const firstPoint = firstPolygon[0];
          if (!firstPoint) return;
          
          const [centerLng, centerLat] = firstPoint;
          
          // Calculate distance using Haversine formula
          const R = 6371e3; // Earth's radius in meters
          const φ1 = userLat * Math.PI / 180;
          const φ2 = centerLat * Math.PI / 180;
          const Δφ = (centerLat - userLat) * Math.PI / 180;
          const Δλ = (centerLng - userLng) * Math.PI / 180;
          
          const a = 
            Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c; // Distance in meters
          
          // console.log(`Distance to ${n.name}: ${(distance/1000).toFixed(2)}km`);
         
          
          if (distance < minDistance) {
            minDistance = distance;
            foundNeighborhood = n;
          }
        });
        
        // console.log("Closest neighborhood:", foundNeighborhood?.name, "Distance:", (minDistance/1000).toFixed(2) + "km");
        // console.log(`Closest-----`,foundNeighborhood);
      }
      
      if (foundNeighborhood) {
        setCurrentNeighborhood(foundNeighborhood);
        const newRegion = calculateNeighborhoodRegion(foundNeighborhood);
        mapRef.current?.animateToRegion(newRegion, 1000);
      }
    }
  }, [location, neighborhoods]);

  // Load neighborhoods data on location change
  useEffect(() => {
    const loadNeighborhoods = async () => {
      try { 
        if (locationFilter === 'all_nyc' || locationFilter === 'all') {
          setShowNeighborhoodFilter(false);
          return;
        }
        
        // Get neighborhoods for the selected borough
        const neighborhoods = await getAllNeighborhoods();
        
        // Filter neighborhoods by the selected borough
        // This will need to be implemented based on how your data is structured
        // For now, we'll just show all neighborhoods
        const options = [
          { label: 'All Neighborhoods', value: 'all' },
          ...neighborhoods.map(neighborhood => ({
            label: neighborhood,
            value: neighborhood
          }))
        ];
        
        setNeighborhoodOptions(options);
        setShowNeighborhoodFilter(true);
      } catch (error) {
        console.error('Error loading neighborhoods:', error);
        setShowNeighborhoodFilter(false);
      }
    };
    
    loadNeighborhoods();
  }, [locationFilter]);

  // Update selected neighborhood when neighborhoodFilter changes
  useEffect(() => {
    if (neighborhoodFilter && neighborhoods.length > 0) {
      const neighborhood = neighborhoods.find(n => n.name === neighborhoodFilter);
      setSelectedNeighborhood(neighborhood || null);
      
      if (neighborhood) {
        // Calculate and set the region to fit the neighborhood
        const newRegion = calculateNeighborhoodRegion(neighborhood);
        mapRef.current?.animateToRegion(newRegion, 1000);
      }
    } else {
      setSelectedNeighborhood(null);
    }
  }, [neighborhoodFilter, neighborhoods]);

  // Refresh user reviews when a new review is added
  const refreshUserReviews = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: reviewData } = await supabase
      .from('Review')
      .select('placeId')
      .eq('userId', session.user.id);

    if (reviewData) {
      setUserReviewedPlaces(new Set(reviewData.map((review: { placeId: string }) => review.placeId)));
    }
  };

  // Update map region when location filter changes
  useEffect(() => {
    if (locationFilter && BOROUGH_REGIONS[locationFilter as keyof typeof BOROUGH_REGIONS] && initialLoadDone.current) {
      // Only update the search area without moving the map
      const newRegion = BOROUGH_REGIONS[locationFilter as keyof typeof BOROUGH_REGIONS];
      setTimeout(() => {
        // searchWithinVisibleArea(newRegion); // This is removed since searching the area comes when onRegionChangeComplete is triggered
        setLastSearchRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
      }, 500);
    }
  }, [locationFilter]);
 
  // Apply filters whenever filter options or pizza places change
  useEffect(() => {
    const applyFilters = async () => {
      if (location && allPizzaPlaces.length > 0) {
        setIsSearchingPlaces(true);
        try {
          // First filter by current neighborhood
          let filteredPlaces = allPizzaPlaces;
          
          if (currentNeighborhood) {
            console.log(`Filtering places for neighborhood: ${currentNeighborhood.name}`);
            filteredPlaces = filteredPlaces.filter(place => {
              const point: [number, number] = [
                place.geometry.location.lng,
                place.geometry.location.lat
              ];
              
              // Check if the place is in any of the neighborhood's polygons
              const isInside = currentNeighborhood.coordinates.some(polygon => {
                return isPointInPolygon(point, polygon);
              });
              
              if (!isInside) {
                console.log(`Place outside neighborhood: ${place.name}`);
              }
              return isInside;
            });
            console.log(`Found ${filteredPlaces.length} places in ${currentNeighborhood.name}`);
          }

          // Then apply other filters
          // filteredPlaces = await filterPizzaPlaces(
          //   filteredPlaces.map(a => {
          //     let rating = a.rating
          //     if(placeReviews[a.place_id]){
          //       rating = placeReviews[a.place_id].rating
          //     }
          //     return {
          //       ...a,
          //       ...placeReviews[a.place_id],
          //       rating
          //     }
          //   }),
          //   sortFilter,
          //   locationFilter,
          //   location
          // );
          
          if (filteredPlaces && Array.isArray(filteredPlaces)) {
            setFilteredPizzaPlaces(filteredPlaces); 
            console.log(`Applied filters: ${sortFilter}, ${locationFilter} - ${filteredPlaces.length} places shown`);
          } else {
            setFilteredPizzaPlaces([]);
            console.log('No places found after filtering');
          }
        } catch (error) {
          console.error('Error applying filters:', error);
          setFilteredPizzaPlaces([]);
        } finally {
          setIsSearchingPlaces(false);
          initialLoadDone.current = true;
        }
      }
    };
    
    applyFilters();
  }, [allPizzaPlaces, sortFilter, locationFilter, location, placeReviews, currentNeighborhood]);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        
        // Request location permissions
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          // If permission denied, show NYC
          setRegion(NEW_YORK_COORDS);
          setIsLoading(false);
          // Search within the visible area even if location permission is denied
          setTimeout(() => searchWithinVisibleArea(NEW_YORK_COORDS), 500);
          return;
        }

        // Get current location
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
        
        // Check if user is in NYC area (using a rough bounding box)
        const isInNYC = currentLocation.coords.latitude >= 40.4774 && 
                       currentLocation.coords.latitude <= 40.9176 && 
                       currentLocation.coords.longitude >= -74.2589 && 
                       currentLocation.coords.longitude <= -73.7004;
        
        // Set region based on location
        const newRegion: Region = isInNYC ? {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        } : NEW_YORK_COORDS;
        
        setRegion(newRegion);
        console.log(isInNYC ? '------Centered map on user location in NYC------' : '----User outside NYC, showing full NYC view-----');
        
        // Search for places in the visible area
        setTimeout(() => searchWithinVisibleArea(newRegion), 500);
        setLastSearchRegion(newRegion);
        setLastKnownRegion(newRegion);
        
      } catch (error) {
        console.error('Error getting location:', error);
        // On error, default to showing all of NYC
        setRegion(NEW_YORK_COORDS);
        setTimeout(() => searchWithinVisibleArea(NEW_YORK_COORDS), 500);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Animation state for Brooklyn pizza places
  const [animatedPizzaPlaces, setAnimatedPizzaPlaces] = useState<PlaceResult[]>([]);
  const animationInProgress = useRef(false);
  
  // Helper function to check if a place is within a neighborhood
  const isPlaceInNeighborhood = (place: PlaceResult, neighborhood: NeighborhoodData): boolean => {
    if (!place.geometry?.location?.lat || !place.geometry?.location?.lng) {
      console.log(`Place ${place.name} missing coordinates`);
      return false;
    }

    const point: [number, number] = [
      place.geometry.location.lng,
      place.geometry.location.lat
    ];
    
    const isInside = neighborhood.coordinates.some(polygon => isPointInPolygon(point, polygon));
    if (!isInside) {
      // console.log(`Place ${place.name} is outside ${neighborhood.name}`);
    }
    return isInside;
  };
  
  // Helper function to calculate distance between two coordinates in miles
  const calculateDistanceInMiles = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    // Haversine formula to calculate distance between two points on Earth
    const R = 3958.8; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in miles
  };

  // Function to search for pizza places within the visible area
  const searchWithinVisibleArea = async (searchRegion: Region) => {
    try { 
      console.log("searchWithinVisibleArea--------",searchRegion)
      // Stop any animation in progress
      animationInProgress.current = false;
      
      setSelectedSearchPlace(null);
      setIsSearchingPlaces(true);
      setIsBrooklynMode(true); // Set to Brooklyn mode since we're using Brooklyn data
      
      // Reset animated places
      setAnimatedPizzaPlaces([]);
      
      // Calculate the corners of the visible area
      const northEast = {
        latitude: searchRegion.latitude + searchRegion.latitudeDelta / 2,
        longitude: searchRegion.longitude + searchRegion.longitudeDelta / 2
      };
      
      const southWest = {
        latitude: searchRegion.latitude - searchRegion.latitudeDelta / 2,
        longitude: searchRegion.longitude - searchRegion.longitudeDelta / 2
      };
      
      // Calculate the center point and approximate radius to cover the visible area
      const centerLat = searchRegion.latitude;
      const centerLng = searchRegion.longitude;
      
      // Calculate approximate radius in meters to cover the visible area
      const radiusInMeters = calculateDistanceInMiles(
        centerLat, 
        centerLng, 
        northEast.latitude, 
        northEast.longitude
      ) * 1609.34; // Convert miles to meters
      
      console.log(`Searching within visible area with radius: ${radiusInMeters.toFixed(0)} meters`);
      
      // Search for Brooklyn pizza places within the calculated radius
      let places = await getNearbyBrooklynPizzaPlaces(
        centerLat, 
        centerLng, 
        radiusInMeters,
        (allPlaces) => {
          // Filter allPlaces by neighborhood before setting them
          const filteredAllPlaces = currentNeighborhood 
            ? allPlaces.filter(place => isPlaceInNeighborhood(place, currentNeighborhood))
            : allPlaces;
          setAllPlaces(filteredAllPlaces);
        },
        neighborhoodFilter
      );
      
      // Filter places by current neighborhood if one is selected
      if (currentNeighborhood) {
        console.log(`Filtering places for neighborhood: ${currentNeighborhood.name}`);
        places = places.filter(place => {
          const isInside = isPlaceInNeighborhood(place, currentNeighborhood);
          if (!isInside) {
            console.log(`Filtered out: ${place.name} - outside ${currentNeighborhood.name}`);
          }
          return isInside;
        });
        console.log(`Found ${places.length} places in ${currentNeighborhood.name}`);
      }
      
      // Sort places by distance from the center of the screen
      const sortedPlaces = places.sort((a, b) => {
        const distanceA = calculateDistanceInMiles(
          centerLat, 
          centerLng, 
          a.geometry.location.lat, 
          a.geometry.location.lng
        );
        const distanceB = calculateDistanceInMiles(
          centerLat, 
          centerLng, 
          b.geometry.location.lat, 
          b.geometry.location.lng
        );
        return distanceA - distanceB; // Sort from closest to farthest
      });
      
      // Limit to 50 places maximum
      const limitedPlaces = sortedPlaces.slice(0, 50);
      
      // Set all pizza places to the filtered list
      setAllPizzaPlaces(limitedPlaces);
      setLastSearchRegion(searchRegion);
      
      console.log(`Found ${limitedPlaces.length} Brooklyn pizza places within visible area (sorted by distance from center)`);
      
      // Start the animation sequence
      animationInProgress.current = true;
      
      const MAX_ANIMATED_PLACES = 80;
      const animationLimit = Math.min(MAX_ANIMATED_PLACES, limitedPlaces.length);
      
      // Clear animated places first
      setAnimatedPizzaPlaces([]);
      
      // Animate the first 50 places one by one, ensuring they're in the neighborhood
      for (let i = 0; i < animationLimit; i++) {
        // Skip animation if user switched to nearby mode
        if (!animationInProgress.current) break;
        
        const place = limitedPlaces[i];
        
        // Double-check that the place is still in the neighborhood
        if (currentNeighborhood && !isPlaceInNeighborhood(place, currentNeighborhood)) {
          console.log(`Skipping animation for ${place.name} - outside ${currentNeighborhood.name}`);
          continue;
        }
        
        // Add haptic feedback for each new place
        Haptics.impactAsync(
          i % 3 === 0 
            ? Haptics.ImpactFeedbackStyle.Light 
            : i % 3 === 1 
              ? Haptics.ImpactFeedbackStyle.Medium 
              : Haptics.ImpactFeedbackStyle.Heavy
        );
        
        // Add this place to the animated places
        setAnimatedPizzaPlaces(prev => [...prev, place]);
        
        // Wait a short time before showing the next place
        await new Promise(resolve => setTimeout(resolve, 2));
      }
      
    } catch (error) {
      console.error('Error finding pizza places in visible area:', error);
      console.log('Failed to find pizza places in visible area');
    } finally {
      setIsSearchingPlaces(false);
      animationInProgress.current = false;
    }
  };

  // Function to render places on the map
  const renderPlaces = () => {
    // Safety check for undefined arrays
    if (!filteredPizzaPlaces) return [];
    
    // If a place is selected through search, only show that place
    if (selectedSearchPlace) {
      return [selectedSearchPlace];
    }
    
    if (sortFilter !== 'all') {
      // For sorted views, ensure we only show places in the current neighborhood
      return currentNeighborhood 
        ? filteredPizzaPlaces.filter(place => isPlaceInNeighborhood(place, currentNeighborhood))
        : filteredPizzaPlaces;
    }
 
    if (isBrooklynMode && animatedPizzaPlaces) {
      // For animated view, ensure we only show places in the current neighborhood
      return currentNeighborhood 
        ? animatedPizzaPlaces.filter(place => isPlaceInNeighborhood(place, currentNeighborhood))
        : animatedPizzaPlaces;
    } 

    return currentNeighborhood 
      ? filteredPizzaPlaces.filter(place => isPlaceInNeighborhood(place, currentNeighborhood))
      : filteredPizzaPlaces;
  }

  const onRegionChange = (newRegion: Region) => {
    mapMovementOngoing.current = true;
    setRegion(newRegion);
    setLastKnownRegion(newRegion);
  };

  // When map movement completes, check if we should trigger a new search
  const onRegionChangeComplete = (newRegion: Region) => {
    mapMovementOngoing.current = false;
    
    // Only trigger a search if the map has moved significantly from the last search position
    if (lastSearchRegion) {
      const latChange = Math.abs(newRegion.latitude - lastSearchRegion.latitude);
      const lngChange = Math.abs(newRegion.longitude - lastSearchRegion.longitude);
      const deltaChange = Math.abs(newRegion.latitudeDelta - lastSearchRegion.latitudeDelta);
      
      const shouldSearch = latChange > lastSearchRegion.latitudeDelta * 0.25 || 
                           lngChange > lastSearchRegion.longitudeDelta * 0.25 ||
                           deltaChange > lastSearchRegion.latitudeDelta * 0.25;
      
      if (shouldSearch && !isSearchingPlaces) {
        // Clear any existing timeout
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
        
        // Set a short delay before searching to prevent multiple rapid searches
        searchTimeoutRef.current = setTimeout(() => {
          // Only search if no further movement is detected
          if (!mapMovementOngoing.current && !isSearchingPlaces) {
            searchWithinVisibleArea(newRegion);
          }
        }, 400); // 400ms delay gives a good balance between responsiveness and avoiding too many searches
      }
    }
  };

  // Update user's active status
  const updateUserActiveStatus = async (isActive: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from('UserLocation')
        .update({ is_active: isActive })
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error updating active status:', error);
      }
    } catch (error) {
      console.error('Error in updateUserActiveStatus:', error);
    }
  };

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        // App came to foreground
        updateUserActiveStatus(true);
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App went to background or became inactive
        updateUserActiveStatus(false);
      }
    });

    // Set active when component mounts
    updateUserActiveStatus(true);

    // Cleanup: Set inactive when component unmounts
    return () => {
      subscription.remove();
      updateUserActiveStatus(false);
    };
  }, []);

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={tw`mt-2`}>Loading map...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={tw`flex-1 justify-center items-center p-4`}>
        <Text style={tw`text-red-500 text-center`}>{errorMsg}</Text>
        <Text style={tw`mt-2 text-center`}>Showing default location: New York City</Text>
      </View>
    );
  }
  
 

  return (
    <View style={styles.container}> 
      
      {/* Search Modal */}
      <SearchModal
        isVisible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        places={allPlaces}
        onClear={()=>{
          console.log('Clearing search, lastKnownRegion:', lastKnownRegion);
          setSelectedSearchPlace(null);
          // Recenter map to last known region
          if (lastKnownRegion && mapRef.current) {
            const region = {
              latitude: lastKnownRegion.latitude,
              longitude: lastKnownRegion.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            };
             
            console.log('Animating to region:', region);
            mapRef.current?.animateToRegion(BOROUGH_REGIONS.manhattan, 1000); 
          }
        }}
        onSelectPlace={(place: PlaceResult) => {
          // Store current region before changing it
          const currentRegion = {
            latitude: region.latitude,
            longitude: region.longitude,
            latitudeDelta: region.latitudeDelta,
            longitudeDelta: region.longitudeDelta,
          };
          console.log('Storing current region:', currentRegion);
          setLastKnownRegion(currentRegion);
          
          setSelectedSearchPlace(place);
          setBottomSheetVisible(true);
          
          // Animate to the selected place
          const newRegion = {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          console.log('Animating to place:', newRegion);
          mapRef.current?.animateToRegion(newRegion, 1000);
        }}
      />
      
      {/* Search this area button */}
      {showSearchThisArea && !isSearchingPlaces && (
        <View style={styles.searchThisAreaContainer}>
          {/* <TouchableOpacity 
            style={styles.searchThisAreaButton}
            onPress={() => searchWithinVisibleArea(region)}
          >
            <Text style={styles.searchThisAreaText}>Search this area</Text>
          </TouchableOpacity> */}
        </View>
      )}
      
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onRegionChange={onRegionChange}
        onRegionChangeComplete={onRegionChangeComplete}
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={true}
        pitchEnabled={true}
        zoomControlEnabled={true}
      >
        {/* Render the selected neighborhood polygon with a pink fill */}
        {selectedNeighborhood && selectedNeighborhood.coordinates.map((polygon, polygonIndex) => (
          <Polygon
            key={`neighborhood-${polygonIndex}`}
            coordinates={polygon.map((coord: [number, number]) => ({
              latitude: coord[1],
              longitude: coord[0],
            }))}
            fillColor="rgba(255, 192, 203, 0.5)"
            strokeColor="pink"
            strokeWidth={2}
          />
        ))}
        
        {/* Render current neighborhood polygon with highlight */}
        {currentNeighborhood && currentNeighborhood.coordinates.map((polygon, index) => (
          <Polygon
            key={`${currentNeighborhood.name}-${index}`}
            coordinates={polygon.map(coord => ({
              latitude: coord[1],
              longitude: coord[0]
            }))}
            fillColor="rgba(255, 82, 82, 0.2)"
            strokeColor="rgba(255, 82, 82, 0.8)"
            strokeWidth={2}
          />
        ))}
        
        {/* User's current location marker */}
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="You are here"
            description="Your current location"
            pinColor="blue"
          >
            <Callout tooltip>
              <View style={tw`bg-white p-2 rounded-lg shadow-md w-40`}>
                <Text style={tw`font-bold text-sm text-blue-600`}>Your Location</Text>
              </View>
            </Callout>
          </Marker>
        )}
        
        {/* Pizza place markers - use animatedPizzaPlaces for Brooklyn mode, filteredPizzaPlaces for normal mode */}
        {renderPlaces().map((place, index) => (
          <Marker
            key={`${place.id}-${index}`}
            coordinate={{
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
            }}
            tracksViewChanges={false}
            onPress={() => {
              // Trigger haptic feedback when a pizza place is selected
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              
              // Reset any existing search selection
              setSelectedSearchPlace(null);
              
              // Set the selected place first
              setSelectedPlace(place);
              
              // Then show the bottom sheet after a small delay to ensure state is updated
              setTimeout(() => {
                setBottomSheetVisible(true);
              }, 50);
            }}
          >
            <PizzaMarker 
              size={30}  
              color={userReviewedPlaces.has(place.place_id) ? "#fff" : "#000"}
              animated={isBrooklynMode && sortFilter === 'all' && index < 100} 
              rating={place.rating || 0}
            />
          </Marker>
        ))}
        
        {/* Render nearby users */}
        {nearbyUsers.map((user) => (
          <Marker
            key={user.id}
            coordinate={{
              latitude: user.latitude,
              longitude: user.longitude
            }}
            title="Nearby Pizza Lover"
          >
            <View style={tw`bg-blue-500 p-2 rounded-full border-2 border-white`}>
              <View style={tw`w-3 h-3 bg-white rounded-full`} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Loading indicator when searching for places */}
      {isSearchingPlaces && (
        <View style={tw`absolute bottom-6 right-6 bg-white p-3 rounded-full shadow-lg flex-row items-center`}>
          <ActivityIndicator size="small" color="#FF5252" style={tw`mr-2`} />
          <Text style={tw`text-red-600 font-medium`}>Finding pizza...</Text>
        </View>
      )}
      
      {/* Bottom sheet for pizza place details */}
      <PizzaPlaceBottomSheet 
        place={selectedPlace}
        isVisible={bottomSheetVisible}
        onClose={() => {
          setBottomSheetVisible(false);
          setSelectedPlace(null);
          refreshUserReviews(); // Refresh user reviews when bottom sheet closes
        }}
      />

      {/* Filter sheet */}
      <FilterBottomSheet 
        isVisible={filterVisible}
        onClose={() => setFilterVisible(false)}
        sortFilter={sortFilter}
        locationFilter={locationFilter}
        neighborhoodFilter={neighborhoodFilter}
        onFilterChange={onFilterChange}
        neighborhoodOptions={neighborhoodOptions}
        showNeighborhoodFilter={locationFilter !== 'all_nyc' && locationFilter !== 'all'}
        setSearchModalVisible={setSearchModalVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    position: 'absolute',
    top: 100, // Increased to position below header
    right: 16,
    zIndex: 51, // Higher than header's z-index
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    backgroundColor: '#111',
    padding: 10, // Increased padding for better touch target
    borderRadius: 25, // Increased for a more circular button
    marginLeft: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 3.84,
  },
});