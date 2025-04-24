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
import { CardBeltProvider, TradingCard, useCardBelt } from '@/contexts/CardBeltContext';

const beltCards: TradingCard[] = [
  {
    id: 'nyc-access-001',
    name: 'NYC Access',
    abilities: [
      {
        name: 'City Explorer',
        description: 'Unlock access to hidden NYC locations',
        isActive: true
      },
      {
        name: 'Transit Master',
        description: 'Navigate NYC public transportation with ease',
        isActive: true
      }
    ],
    attack: 60,
    defense: 80,
    rarity: 'Rare',
    collectorNumber: '001',
    flavorText: 'The key to unlocking the secrets of New York City.'
  },
  {
    id: 'market-ad-002',
    name: 'Market Advertisement',
    abilities: [
      {
        name: 'Local Reach',
        description: 'Boost visibility in neighborhood markets',
        isActive: true
      },
      {
        name: 'Social Boost',
        description: 'Increase engagement on social platforms',
        isActive: true
      }
    ],
    attack: 75,
    defense: 55,
    rarity: 'Uncommon',
    collectorNumber: '002',
    flavorText: 'Amplify your presence in the local marketplace.'
  },
  {
    id: 'direct-msg-003',
    name: 'Direct Message',
    abilities: [
      {
        name: 'Instant Connect',
        description: 'Establish direct communication channels',
        isActive: true
      },
      {
        name: 'Network Sync',
        description: 'Synchronize with other users instantly',
        isActive: true
      }
    ],
    attack: 65,
    defense: 70,
    rarity: 'Uncommon',
    collectorNumber: '003',
    flavorText: 'Bridge the gap between users with seamless communication.'
  }
];

function CardSelectionScreen() {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const { toggleCardSelection, isCardSelected } = useCardBelt();

  const handleCardSelected = (card: TradingCard) => {
    toggleCardSelection(card);
    console.log('Card selected:', card.name);
  };

  return (
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

        {/* Card Previews */}
        <View style={styles.cardContainer}>
          {beltCards.map((card) => (
            <PokemonCard 
              key={card.id}
              card={card}
              onAddToBelt={handleCardSelected}
              isSelected={isCardSelected(card.id)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function TradingCardPreviewScreen() {
  return <CardSelectionScreen />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 20,
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