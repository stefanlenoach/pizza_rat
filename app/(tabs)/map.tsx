import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';
import PizzaMapView from '@/components/MapView';
import tw from '@/utils/tw';
import { Stack, usePathname } from 'expo-router';
import { useRouter } from 'expo-router';

export interface FilterType {
  sort: string;
  location: string;
  neighborhood?: string;
}

export default function MapScreen() {
  // const { filters } = useLocalSearchParams<{ filters: string }>();
  // const parsedFilters: FilterType = filters ? JSON.parse(filters) : {
  //   sort: 'all',
  //   location: 'all_nyc'
  // };
 const router = useRouter();
  const pathname = usePathname();

  const [ filters, setFilters ] = useState<FilterType>({
    sort: 'all',
    location: 'all_nyc',
    neighborhood:"all"
  });

    const handleFilterChange = (filterType: keyof FilterType, value: string) => { 
      setFilters(prev => ({
        ...prev,
        [filterType]: value
      }));
    }; 


      // Update map screen when filters change
    useEffect(() => {
      if (pathname.includes('/map')) {
        router.setParams({ filters: JSON.stringify(filters) });
      }
    }, [filters]);

  return (
    <View style={tw`flex-1`}>
      <StatusBar style="light" />
      <View style={tw`flex-1`}>
        <PizzaMapView 
          sortFilter={filters.sort}
          locationFilter={filters.location}
          neighborhoodFilter={filters.neighborhood}
          onFilterChange={handleFilterChange}
        />
      </View>
    </View>
  );
}