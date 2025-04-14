import { Region } from 'react-native-maps';
import { PlaceResult } from './placesApi';

export interface NeighborhoodData {
  id: number;
  name: string;
  borough: string;
  abbreviation: string;
  coordinates: number[][][];
}

// Function to parse the GeoJSON data into a more usable format
export const parseNeighborhoodData = (geojsonData: any): NeighborhoodData[] => {
  if (!geojsonData || !geojsonData.features || !Array.isArray(geojsonData.features)) {
    console.error('Invalid GeoJSON data structure');
    return [];
  }

  return geojsonData.features.map((feature: any) => {
    const { properties, geometry, id } = feature;
    
    // Extract the neighborhood properties
    return {
      id,
      name: properties.NTAName,
      borough: properties.BoroName,
      abbreviation: properties.NTAAbbrev,
      coordinates: geometry.coordinates[0], // Take the first polygon if multiple
    };
  });
};

// Function to check if a point is inside a polygon using ray casting algorithm
export const isPointInPolygon = (
  point: [number, number], 
  polygon: number[][]
): boolean => {
  const x = point[0];
  const y = point[1];
  
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
};

// Filter pizza places by neighborhood
export const filterPlacesByNeighborhood = (
  places: PlaceResult[],
  neighborhood: NeighborhoodData
): PlaceResult[] => {
  return places.filter(place => {
    const point: [number, number] = [
      place.geometry.location.lng,
      place.geometry.location.lat
    ];
    
    return isPointInPolygon(point, neighborhood.coordinates);
  });
};

// Calculate the center and delta for a neighborhood to set the map region
export const calculateNeighborhoodRegion = (neighborhood: NeighborhoodData): Region => {
  // Calculate bounds
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  
  neighborhood.coordinates.forEach(coord => {
    const lng = coord[0];
    const lat = coord[1];
    
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  });
  
  // Calculate center
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  
  // Calculate deltas with some padding
  const latDelta = (maxLat - minLat) * 1.2;
  const lngDelta = (maxLng - minLng) * 1.2;
  
  return {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta
  };
};

// Get all neighborhood names for a given borough
export const getNeighborhoodsByBorough = (
  neighborhoods: NeighborhoodData[],
  borough: string
): NeighborhoodData[] => {
  if (borough === 'all_nyc') return neighborhoods;
  
  return neighborhoods.filter(n => 
    n.borough.toLowerCase() === borough.replace('_', ' ').toLowerCase()
  );
};

// Get a specific neighborhood by name
export const getNeighborhoodByName = (
  neighborhoods: NeighborhoodData[],
  name: string
): NeighborhoodData | undefined => {
  return neighborhoods.find(n => n.name === name);
};