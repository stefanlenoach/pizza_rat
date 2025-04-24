import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TouchableOpacity } from '@/components/CustomTouchableOpacity';
import { Text } from '@/components/CustomText';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PokemonCard from '@/components/TradingCards/baseCard';
import CardBelt from '@/components/TradingCards/CardBelt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/useThemeColor'; 
import * as Haptics from 'expo-haptics';
import { CardBeltProvider, TradingCard } from '@/contexts/CardBeltContext';

export default function TradingCardPreviewScreen() {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background'); 

  const handleCardSelected = (card: TradingCard) => {
    // You could navigate to a detailed view of the card here
    console.log('Card selected:', card.name);
  };

  return (
    <CardBeltProvider>
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back()}}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <ScrollView style={styles.scrollView}>
          {/* Card Belt - Shows active cards */}
          <View style={styles.beltContainer}>
            <CardBelt onCardPress={handleCardSelected} />
          </View>

          {/* Card Preview */}
          <View style={styles.cardContainer}>
            <PokemonCard onAddToBelt={handleCardSelected} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </CardBeltProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  cardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  beltContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  backButton: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
});