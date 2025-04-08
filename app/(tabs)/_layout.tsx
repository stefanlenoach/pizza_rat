import { Stack, usePathname } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import PizzaRatHeader from '@/components/PizzaRatHeader';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();

  const shouldShowHeader = !pathname.includes('/account');

  return (
    <Stack
      screenOptions={{
        headerShown: shouldShowHeader,
        header: () => (
          <PizzaRatHeader
            showFilters={true}
            onFilterChange={(filterType, value) => {
              // Handle filter change
            }}
            rightIcon={
              <Ionicons
                name="settings"
                size={24}
                color={Colors[colorScheme ?? 'light'].tint}
                onPress={() => router.push('/account')}
                style={{ padding: 8 }}
              />
            }
          />
        ),
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="map" />
    </Stack>
  );
}
