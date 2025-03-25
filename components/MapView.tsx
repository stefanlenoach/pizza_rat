import React, { useState, useEffect, useRef } from 'react';
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
import { getAllBrooklynPizzaPlaces } from '@/utils/brooklynPizzaData';

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

  // Apply filters whenever filter options or pizza places change
  useEffect(() => {
    const applyFilters = async () => {
      if (allPizzaPlaces.length > 0) {
        const filtered = await filterPizzaPlaces(
          allPizzaPlaces,
          sortFilter,
          locationFilter,
          location
        );
        setFilteredPizzaPlaces(filtered);
        console.log(`Applied filters: ${sortFilter}, ${locationFilter} - ${filtered.length} places shown`);
      }
    };
    
    applyFilters();
  }, [allPizzaPlaces, sortFilter, locationFilter, location]);

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
          return;
        }

        // Get current location
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
        
        // Center map on user's current location
        if (currentLocation) {
          const newRegion = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          };
          setRegion(newRegion);
          console.log('Centered map on current location:', newRegion);
          
          // Automatically search for pizza places within 5 miles
          await findNearbyPizzaPlaces(currentLocation.coords.latitude, currentLocation.coords.longitude);
        }
      } catch (error) {
        console.error('Error getting location:', error);
        setErrorMsg('Could not determine your location');
        // Fall back to NYC if there's an error
        setRegion(NEW_YORK_COORDS);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);
  
  // Function to find nearby pizza places
  const findNearbyPizzaPlaces = async (lat: number, lng: number) => {
    try {
      // Stop any Brooklyn animation in progress
      animationInProgress.current = false;
      
      setIsSearchingPlaces(true);
      setIsBrooklynMode(false);
      
      // Update the region to center on the provided location
      setRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      
      // Search for pizza places within 5 miles (8047 meters)
      const places = await searchNearbyPizzaPlaces(lat, lng, 8047);
      setAllPizzaPlaces(places);
      setAnimatedPizzaPlaces(places); // Show all places immediately for nearby search
      
      console.log(`Found ${places.length} pizza places within 5 miles`);
    } catch (error) {
      console.error('Error finding nearby pizza places:', error);
      console.log('Failed to find nearby pizza places');
    } finally {
      setIsSearchingPlaces(false);
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
  
  // Function to load Brooklyn pizza places within 2 miles with animation
  const loadAllBrooklynPizzaPlaces = async () => {
    try {
      setIsSearchingPlaces(true);
      setIsBrooklynMode(true);
      
      // Reset animated places
      setAnimatedPizzaPlaces([]);
      
      // Update the region to center on Brooklyn
      setRegion(BROOKLYN_COORDS);
      
      // Get current location coordinates
      let userLat = BROOKLYN_COORDS.latitude;
      let userLng = BROOKLYN_COORDS.longitude;
      
      // If user location is available, use it instead
      if (location) {
        const { coords } = location;
        userLat = coords.latitude;
        userLng = coords.longitude;
      }
      
      // Load all Brooklyn pizza places from our dataset
      const allPlaces = await getAllBrooklynPizzaPlaces();
      
      // Filter places to only those within 2 miles of current location
      const nearbyPlaces = allPlaces.filter(place => {
        const distance = calculateDistanceInMiles(
          userLat,
          userLng,
          place.geometry.location.lat,
          place.geometry.location.lng
        );
        return distance <= 2; // 2 mile radius
      });
      
      console.log(`Filtered from ${allPlaces.length} to ${nearbyPlaces.length} places within 2 miles`);
      
      // Set all pizza places to the filtered list
      setAllPizzaPlaces(nearbyPlaces);
      
      // Start the animation sequence
      animationInProgress.current = true;
      
      const MAX_ANIMATED_PLACES = 50;
      const animationLimit = Math.min(MAX_ANIMATED_PLACES, nearbyPlaces.length);
      
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
        setAnimatedPizzaPlaces(prev => [...prev, nearbyPlaces[i]]);
        
        // Wait a short time before showing the next place
        await new Promise(resolve => setTimeout(resolve, 2));
      }
      
      // If there are more than 50 places, add the rest after exactly 1 second
      if (nearbyPlaces.length > MAX_ANIMATED_PLACES && animationInProgress.current) {
        // Schedule the remaining places to appear exactly 1 second after the 50th place
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Make sure animation is still in progress (user hasn't switched modes)
        if (animationInProgress.current) {
          // First set the remaining places to ensure rendering starts
          setAnimatedPizzaPlaces(nearbyPlaces);
          
          // Then trigger a stronger haptic pattern after a tiny delay to ensure it's felt during rendering
          // Use a notification instead of just impact for a more noticeable feedback
          setTimeout(() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            // Follow with a heavy impact for an even more pronounced effect
            setTimeout(() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }, 100);
          }, 10);
        }
      }
      
      console.log(`Loaded ${nearbyPlaces.length} Brooklyn pizza places within 2 miles`);
    } catch (error) {
      console.error('Error loading Brooklyn pizza places:', error);
      console.log('Failed to load Brooklyn pizza places');
    } finally {
      setIsSearchingPlaces(false);
      animationInProgress.current = false;
    }
  };

  const onRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
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

  return (
    <View style={styles.container}>
      {/* Brooklyn mode toggle button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, isBrooklynMode ? styles.activeButton : {}]}
          onPress={loadAllBrooklynPizzaPlaces}
        >
          <Text style={[styles.buttonText, isBrooklynMode ? styles.activeButtonText : {}]}>Brooklyn Pizza</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, !isBrooklynMode ? styles.activeButton : {}]}
          onPress={() => location ? findNearbyPizzaPlaces(location.coords.latitude, location.coords.longitude) : null}
          disabled={!location}
        >
          <Text style={[styles.buttonText, !isBrooklynMode ? styles.activeButtonText : {}]}>Nearby Pizza</Text>
        </TouchableOpacity>
      </View>
      
      {/* Pizza count indicator */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {isSearchingPlaces ? 'Loading...' : `${filteredPizzaPlaces.length} Pizza Restaurants`}
        </Text>
      </View>
      
      <MapView
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={onRegionChange}
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={true}
        pitchEnabled={true}
        zoomControlEnabled={true}
      >
        {/* User's current location marker and 5-mile radius circle */}
        {location && (
          <>
            <Circle 
              center={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              radius={8047} // 5 miles in meters
              strokeWidth={2}
              strokeColor="rgba(65, 105, 225, 0.5)"
              fillColor="rgba(65, 105, 225, 0.1)"
            />
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
                  <Text style={tw`text-xs mt-1`}>The circle shows a 5-mile radius</Text>
                </View>
              </Callout>
            </Marker>
          </>
        )}
        
        {/* Pizza place markers - use animatedPizzaPlaces for Brooklyn mode, filteredPizzaPlaces for normal mode */}
        {(isBrooklynMode ? animatedPizzaPlaces : filteredPizzaPlaces).map((place) => (
          <Marker
            key={place.id}
            coordinate={{
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
            }}
            title={place.name}
            description={place.vicinity}
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
              color="#FF5252" 
              animated={isBrooklynMode} 
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
      
      {/* Display count of found pizza places */}
      {filteredPizzaPlaces.length > 0 && (
        <View style={tw`absolute top-4 left-4 bg-white p-2 rounded-lg shadow-md`}>
          <Text style={tw`text-sm font-bold`}>
            Found {filteredPizzaPlaces.length} pizza places
          </Text>
          <Text style={tw`text-xs text-gray-600`}>
            Blue circle: 1-mile radius
          </Text>
        </View>
      )}
      
      {/* Bottom sheet for pizza place details */}
      <PizzaPlaceBottomSheet 
        place={selectedPlace}
        isVisible={bottomSheetVisible}
        onClose={() => {
          setBottomSheetVisible(false);
          setSelectedPlace(null);
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
  buttonContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  button: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginHorizontal: 5,
    flex: 1,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#FF5A5F',
  },
  buttonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  activeButtonText: {
    color: 'white',
  },
  countContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    zIndex: 1,
  },
  countText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
