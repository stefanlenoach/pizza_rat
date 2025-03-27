import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import PizzaMapView from '@/components/MapView';
import tw from '@/utils/tw';

export default function MapScreen() {
  return (
    <View style={tw`flex-1`}>
      <StatusBar style="light" />
      <View style={tw`flex-1`}>
        <PizzaMapView 
          sortFilter="best"
          locationFilter="near_me"
        />
      </View>
    </View>
  );
}
