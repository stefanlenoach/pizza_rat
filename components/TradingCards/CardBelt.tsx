import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TouchableOpacity } from '@/components/CustomTouchableOpacity';
import { Text } from '@/components/CustomText';
import { useCardBelt, TradingCard } from '@/contexts/CardBeltContext';
import * as Haptics from 'expo-haptics';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';

interface CardBeltProps {
  onCardPress?: (card: TradingCard) => void;
}

export default function CardBelt({ onCardPress }: CardBeltProps) {
  const { beltCards, removeCardFromBelt, maxBeltSize } = useCardBelt();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const handleCardPress = (card: TradingCard) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onCardPress) {
      onCardPress(card);
    }
  };

  const handleRemoveCard = (card: TradingCard) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeCardFromBelt(card.id);
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>
        Card Belt ({beltCards.length}/{maxBeltSize})
      </Text>
      
      {beltCards.length === 0 ? (
        <View style={styles.emptyBelt}>
          <Text style={[styles.emptyText, { color: '#8c8c8c' }]}>
            Add cards to your belt to activate their abilities
          </Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.beltScroll}>
          {beltCards.map((card) => (
            <View key={card.id} style={styles.cardContainer}>
              <TouchableOpacity
                style={styles.cardButton}
                onPress={() => handleCardPress(card)}
              >
                <Text style={styles.cardName} numberOfLines={1}>
                  {card.name}
                </Text>
                <View style={styles.abilityContainer}>
                  {card.abilities.map((ability, index) => (
                    <View key={index} style={styles.ability}>
                      <View style={styles.activeDot} />
                      <Text style={styles.abilityName} numberOfLines={1}>
                        {ability.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveCard(card)}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  beltScroll: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  emptyBelt: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: 500,
  },
  cardContainer: {
    width: 120,
    marginRight: 10,
    position: 'relative',
  },
  cardButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  cardName: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  abilityContainer: {
    flex: 1,
  },
  ability: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: '#10b981',
    marginRight: 4,
  },
  abilityName: {
    fontSize: 12,
    flex: 1,
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 11,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
});