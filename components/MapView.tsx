import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, Platform, TouchableOpacity, Animated } from 'react-native';
import { Text } from '@/components/CustomText';
import MapView, { Marker, Region, Callout, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import tw from '@/utils/tw';
import { searchNearbyPizzaPlaces, PlaceResult } from '@/utils/placesApi';
import { filterPizzaPlaces } from '@/utils/filterUtils';
import PizzaMarker from './PizzaMarker';
import PizzaPlaceBottomSheet from './PizzaPlaceBottomSheet';
import SearchModal from './SearchModal';
import { getAllBrooklynPizzaPlaces, getNearbyBrooklynPizzaPlaces } from '@/utils/brooklynPizzaData';
import { supabase } from '@/lib/supabase';
import { useUser } from "@/contexts/UserContext";
import { Ionicons } from '@expo/vector-icons';

// Default coordinates for New York City (Manhattan)
const NEW_YORK_COORDS = {
  latitude: 40.7128,
  longitude: -74.0060,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// Brooklyn coordinates
const BROOKLYN_COORDS = {
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

// We're using userInterfaceStyle="dark" instead of custom styling

interface PizzaMapViewProps {
  sortFilter: string;
  locationFilter: string;
}

export default function PizzaMapView({ sortFilter, locationFilter }: PizzaMapViewProps) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [region, setRegion] = useState<Region>(NEW_YORK_COORDS);
  const [isLoading, setIsLoading] = useState(true);
  const [allPizzaPlaces, setAllPizzaPlaces] = useState<PlaceResult[]>([]);
  const [filteredPizzaPlaces, setFilteredPizzaPlaces] = useState<PlaceResult[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [isBrooklynMode, setIsBrooklynMode] = useState(false); 
  const { placeReviews, searchModalVisible, setSearchModalVisible } = useUser();
  const [allPlaces, setAllPlaces] = useState<PlaceResult[]>([]);
 
  

  const [showSearchThisArea, setShowSearchThisArea] = useState(false);
  const [lastSearchRegion, setLastSearchRegion] = useState<Region | null>(null);
  const mapRef = useRef<MapView | null>(null);

  const [userReviewedPlaces, setUserReviewedPlaces] = useState<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

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
        searchWithinVisibleArea(newRegion);
        setLastSearchRegion(newRegion);
        setShowSearchThisArea(false);
      }, 500);
    }
  }, [locationFilter]);
 
  // Apply filters whenever filter options or pizza places change
  useEffect(() => {
    const applyFilters = async () => {
      if (location && allPizzaPlaces.length > 0) {
        setIsSearchingPlaces(true);
        try {
          const filtered = await filterPizzaPlaces(
            allPizzaPlaces.map(a => {

              let rating = a.rating
              if(placeReviews[a.place_id]){
                rating = placeReviews[a.place_id].rating
              }

              return {
                ...a,
                ...placeReviews[a.place_id],
                rating
              }
            }),
            sortFilter,
            locationFilter,
            location, 
          );
          
          if (filtered && Array.isArray(filtered)) {
            setFilteredPizzaPlaces(filtered);
            console.log(`Applied filters: ${sortFilter}, ${locationFilter} - ${filtered.length} places shown`);
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
  }, [allPizzaPlaces, sortFilter, locationFilter, location, placeReviews]);

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
        const newRegion = isInNYC ? {
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
        setShowSearchThisArea(false);
        
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
  
  // Function to search for pizza places within the visible map area
  const searchWithinVisibleArea = async (searchRegion: Region) => {
    try { 
      console.log("searchWithinVisibleArea--------",searchRegion)
      // Stop any animation in progress
      animationInProgress.current = false;
      
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
      // This uses the Haversine formula to get distance from center to corner
      const radiusInMeters = calculateDistanceInMiles(
        centerLat, 
        centerLng, 
        northEast.latitude, 
        northEast.longitude
      ) * 1609.34; // Convert miles to meters
      
      console.log(`Searching within visible area with radius: ${radiusInMeters.toFixed(0)} meters`);
      
      // Search for Brooklyn pizza places within the calculated radius
      const places = await getNearbyBrooklynPizzaPlaces(centerLat, centerLng, radiusInMeters,setAllPlaces);
      
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
 
      
      // Limit to 100 places maximum
      const limitedPlaces = sortedPlaces.slice(0, 50);
      
      // Set all pizza places to the filtered list
      setAllPizzaPlaces(limitedPlaces);
      setLastSearchRegion(searchRegion);
      setShowSearchThisArea(false);
      
      console.log(`Found ${limitedPlaces.length} Brooklyn pizza places within visible area (sorted by distance from center)`);
      
      // Start the animation sequence
      animationInProgress.current = true;
      
      const MAX_ANIMATED_PLACES = 50;
      const animationLimit = Math.min(MAX_ANIMATED_PLACES, limitedPlaces.length);
      
      // Animate the first 50 places one by one
      for (let i = 0; i < animationLimit; i++) {
        // Skip animation if user switched to nearby mode
        if (!animationInProgress.current) break;
        
        // Add haptic feedback for each new place
        Haptics.impactAsync(
          i % 3 === 0 
            ? Haptics.ImpactFeedbackStyle.Light 
            : i % 3 === 1 
              ? Haptics.ImpactFeedbackStyle.Medium 
              : Haptics.ImpactFeedbackStyle.Heavy
        );
        
        // Add this place to the animated places
        setAnimatedPizzaPlaces(prev => [...prev, limitedPlaces[i]]);
        
        // Wait a short time before showing the next place
        await new Promise(resolve => setTimeout(resolve, 2));
      }
      
      // If there are more than 50 places, add the rest after exactly 1 second
      // if (limitedPlaces.length > MAX_ANIMATED_PLACES && animationInProgress.current) {
      //   // Schedule the remaining places to appear exactly 1 second after the 50th place
      //   await new Promise(resolve => setTimeout(resolve, 10));
        
      //   // Make sure animation is still in progress (user hasn't switched modes)
      //   if (animationInProgress.current) {
      //     // First set the remaining places to ensure rendering starts
      //     console.log("------------limitedPlaces",limitedPlaces.length)
      //     // setAnimatedPizzaPlaces(prev => [...prev, ...limitedPlaces]);
          
      //     // Then trigger a stronger haptic pattern after a tiny delay to ensure it's felt during rendering
      //     // Use a notification instead of just impact for a more noticeable feedback
      //     setTimeout(() => {
      //       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
      //       // Follow with a heavy impact for an even more pronounced effect
      //       setTimeout(() => {
      //         Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      //       }, 100);
      //     }, 10);
      //   }
      // }
      
    } catch (error) {
      console.error('Error finding pizza places in visible area:', error);
      console.log('Failed to find pizza places in visible area');
    } finally {
      setIsSearchingPlaces(false);
      animationInProgress.current = false;
    }
  };
  
  // Animation state for Brooklyn pizza places
  const [animatedPizzaPlaces, setAnimatedPizzaPlaces] = useState<PlaceResult[]>([]);
  const animationInProgress = useRef(false);
  
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

  const onRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
    
    // If the map has moved significantly from the last search position, show the "Search this area" button
    if (lastSearchRegion) {
      const latChange = Math.abs(newRegion.latitude - lastSearchRegion.latitude);
      const lngChange = Math.abs(newRegion.longitude - lastSearchRegion.longitude);
      const deltaChange = Math.abs(newRegion.latitudeDelta - lastSearchRegion.latitudeDelta);
      
      // Show button if the map has moved more than 25% of the visible area
      if (latChange > lastSearchRegion.latitudeDelta * 0.25 || 
          lngChange > lastSearchRegion.longitudeDelta * 0.25 ||
          deltaChange > lastSearchRegion.latitudeDelta * 0.25) {
        setShowSearchThisArea(true);
      }
    }
  };

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

  const renderPlaces = () => {
    // Safety check for undefined arrays
    if (!filteredPizzaPlaces) return [];
    
    if (sortFilter !== 'all') {
      return filteredPizzaPlaces  
    }
 
    if (isBrooklynMode && animatedPizzaPlaces) {
      return animatedPizzaPlaces;
    } 

    return filteredPizzaPlaces;
  }

  // console.log('isBrooklynMode',isBrooklynMode)
  // console.log('filteredPizzaPlaces',filteredPizzaPlaces?.length) 
 
  return (
    <View style={styles.container}> 
      
      {/* Search Modal */}
      <SearchModal
        isVisible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        places={allPlaces}
        onSelectPlace={(place: PlaceResult) => {
          setSelectedPlace(place);
          setBottomSheetVisible(true);
          // Animate to the selected place
          mapRef.current?.animateToRegion({
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        }}
      />
      
      {/* Search this area button */}
      {showSearchThisArea && !isSearchingPlaces && (
        <View style={styles.searchThisAreaContainer}>
          <TouchableOpacity 
            style={styles.searchThisAreaButton}
            onPress={() => searchWithinVisibleArea(region)}
          >
            <Text style={styles.searchThisAreaText}>Search this area</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Pizza count indicator removed */}
      
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={onRegionChange}
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={true}
        pitchEnabled={true}
        zoomControlEnabled={true}
        userInterfaceStyle="dark"
      >
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
              
              setSelectedPlace(place);
              setBottomSheetVisible(true);
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
      </MapView>
      
      {/* Loading indicator when searching for places */}
      {isSearchingPlaces && (
        <View style={tw`absolute bottom-6 right-6 bg-white p-3 rounded-full shadow-lg flex-row items-center`}>
          <ActivityIndicator size="small" color="#FF5252" style={tw`mr-2`} />
          <Text style={tw`text-red-600 font-medium`}>Finding pizza...</Text>
        </View>
      )}
      
      {/* Pizza place count display removed */}
      
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
  searchThisAreaContainer: {
    position: 'absolute',
    top: 175,
    alignSelf: 'center',
    zIndex: 5,
  },
  searchThisAreaButton: {
    backgroundColor: '#111',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 3.84,
  },
  searchThisAreaText: {
    color: '#FF5A5F',
    // fontWeight: 'bold',
    fontSize: 14,
  },
});
