import React, { useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import PizzaMapView from '@/components/MapView';
import PizzaRatHeader from '@/components/PizzaRatHeader';
import tw from '@/utils/tw';

export default function MapScreen() {
  const [sortFilter, setSortFilter] = useState('best');
  const [locationFilter, setLocationFilter] = useState('near_me');

  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === 'sort') {
      setSortFilter(value);
    } else if (filterType === 'location') {
      setLocationFilter(value);
    }
  };

  return (
    <View style={tw`flex-1`}>
      <StatusBar style="light" />
      <PizzaRatHeader 
        showFilters={true} 
        onFilterChange={handleFilterChange}
        sortFilter={sortFilter}
        locationFilter={locationFilter}
      />
      <View style={tw`flex-1`}>
        <PizzaMapView 
          sortFilter={sortFilter}
          locationFilter={locationFilter}
        />
      </View>
    </View>
  );
}
