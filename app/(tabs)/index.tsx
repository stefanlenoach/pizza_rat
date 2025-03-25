import { Image, StyleSheet, Platform, View, Text, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { HelloWave } from '@/components/HelloWave';
import PizzaRatHeader from '@/components/PizzaRatHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import tw from '@/utils/tw';

export default function HomeScreen() {
  return (
    <View style={tw`flex-1 bg-[#0E1010] text-[#E2FCFC]`}>
      <StatusBar style="light" />
      <PizzaRatHeader title="" />
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-4`}>
        <ThemedView >
          <ThemedText type="title" style={tw`text-8xl text-center text-red-300 bg-[#0E1010] pt-[180px]`}>PiZZA RAT</ThemedText>



        </ThemedView>


      </ScrollView>
    </View>
  );
}
