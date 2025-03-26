import React, { useState } from 'react';
import { Image, StyleSheet, Platform, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AntDesign } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { HelloWave } from '@/components/HelloWave';
import PizzaRatHeader from '@/components/PizzaRatHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import OnboardingFlow from '@/components/OnboardingFlow';
import tw from '@/utils/tw';

export default function HomeScreen() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleOpenOnboarding = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowOnboarding(true);
  };

  return (
    <View style={tw`flex-1 bg-[#0E1010] text-[#E2FCFC]`}>
      <StatusBar style="light" />
      <PizzaRatHeader title="" />
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-4`}>
        <ThemedView>
          <ThemedText type="title" style={tw`text-8xl text-center text-red-300 bg-[#0E1010] pt-[180px]`}>PiZZA RAT</ThemedText>
          
          <View style={tw`items-center mt-12`}>
            <TouchableOpacity 
              style={tw`bg-red-600 py-4 px-6 rounded-xl flex-row items-center`}
              onPress={handleOpenOnboarding}
            >
              <AntDesign name="infocirlceo" size={20} color="#FFFFFF" style={tw`mr-2`} />
              <Text style={tw`text-white font-bold text-lg`}>How It Works</Text>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ScrollView>

      {/* Onboarding Flow */}
      <OnboardingFlow 
        visible={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
      />
    </View>
  );
}
