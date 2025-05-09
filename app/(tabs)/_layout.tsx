import { Stack, usePathname } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import PizzaRatHeader from '@/components/PizzaRatHeader';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export type FilterType = {
  sort: string;
  location: string;
  neighborhood?: string;
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<FilterType>({
    sort: 'all',
    location: 'all_nyc',
    neighborhood: 'all'
  });

  const shouldShowHeader = !pathname.includes('/account');

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
    <Stack
      screenOptions={{
        headerShown: shouldShowHeader,
        header: () => (
          <PizzaRatHeader
            showFilters={false}
            onFilterChange={handleFilterChange}
            sortFilter={filters.sort}
            locationFilter={filters.location}
            neighborhoodFilter={filters.neighborhood}
            rightIcon={
              <Ionicons
                name="settings"
                size={24}
                color={Colors[colorScheme ?? 'light'].tint}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/others/settings')}}
                style={{ padding: 8 }}
              />
            }
          />
        ),
      }}>
      <Stack.Screen 
        name="index" 
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="map" 
        options={{
          headerShown: true
        }}
        initialParams={{ filters: JSON.stringify(filters) }}
      />
    </Stack>
  );
}
