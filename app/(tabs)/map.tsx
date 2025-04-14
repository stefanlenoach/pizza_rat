import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';
import PizzaMapView from '@/components/MapView';
import tw from '@/utils/tw';

export interface FilterType {
  sort: string;
  location: string;
  neighborhood?: string;
}

export default function MapScreen() {
  const { filters } = useLocalSearchParams<{ filters: string }>();
  const parsedFilters: FilterType = filters ? JSON.parse(filters) : {
    sort: 'all',
    location: 'all_nyc'
  };

  return (
    <View style={tw`flex-1`}>
      <StatusBar style="light" />
      <View style={tw`flex-1`}>
        <PizzaMapView 
          sortFilter={parsedFilters.sort}
          locationFilter={parsedFilters.location}
          neighborhoodFilter={parsedFilters.neighborhood}
        />
      </View>
    </View>
  );
}