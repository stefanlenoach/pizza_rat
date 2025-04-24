import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { TouchableOpacity } from '@/components/CustomTouchableOpacity';
import { Text } from '@/components/CustomText';
import { useCardBelt, TradingCard, CardAbility } from '@/contexts/CardBeltContext';
import * as Haptics from 'expo-haptics';

interface PokemonCardProps {
  card?: TradingCard;
  onAddToBelt?: (card: TradingCard) => void;
  isSelected?: boolean;
}

export default function PokemonCard({ 
  card,
  onAddToBelt,
  isSelected = false
}: PokemonCardProps) {
  // Use default card data if none provided
  const defaultCard: TradingCard = {
    id: 'sparkitty-042',
    name: 'Sparkitty',
    abilities: [
      {
        name: 'Stunning Static',
        description: 'Stun an opponent\'s card for 2 turns',
        isActive: false
      },
      {
        name: 'Water Weakness',
        description: 'Deals double damage against Water-type cards',
        isActive: false
      }
    ],
    attack: 70,
    defense: 40,
    rarity: 'Uncommon',
    collectorNumber: '042',
    flavorText: 'The static electricity in its fur can light up a small town for days.'
  };

  const cardData = card || defaultCard;
  
  // Belt integration
  const { isCardInBelt, addCardToBelt, beltCards, maxBeltSize } = useCardBelt();
  const isInBelt = isCardInBelt(cardData.id);

  // Use Animated.Value for animations
  const rotation = useRef(new Animated.Value(0)).current;
  const borderPhase = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotateAnimation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 360,
        duration: 10000, // Slower rotation for smoother effect
        useNativeDriver: false, // Cannot use native driver for style props like 'background' or non-transform styles if we were interpolating complex styles. True is better for transforms.
      })
    );

    const borderAnimation = Animated.loop(
      Animated.timing(borderPhase, {
        toValue: 100,
        duration: 2000,
        useNativeDriver: false, // Same reason as above
      })
    );

    rotateAnimation.start();
    borderAnimation.start();

    return () => {
      rotateAnimation.stop();
      borderAnimation.stop();
      // Reset values if needed when component unmounts
      rotation.setValue(0);
      borderPhase.setValue(0);
    };
  }, [rotation, borderPhase]);

  // Interpolate rotation for transform style
  const animatedRotation = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  // --- Simplified Holographic Effects --- React Native limitations

  const cardBorderStyle = {
    borderColor: isSelected ? '#10b981' : isInBelt ? '#10b981' : 'purple', // Green border when selected or in belt
    borderWidth: isSelected ? 4 : isInBelt ? 3 : 2,
    ...Platform.select({
      ios: {
        shadowColor: isSelected ? '#10b981' : isInBelt ? '#10b981' : '#f0f',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
    }),
  };

  const headerStyle = {
    backgroundColor: '#ef4444', // Fallback solid color
     ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
    }),
  };

  const imageContainerStyle = {
    backgroundColor: '#dbeafe', // Fallback solid color
     ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  };

  const descriptionStyle = {
     backgroundColor: 'white',
     ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  }

  // Simplified sparkle effect - using animated opacity
  const sparkleOpacity = rotation.interpolate({
      inputRange: [0, 90, 180, 270, 360],
      outputRange: [1, 0.7, 1, 0.7, 1] // Simple pulse
  });

  const handleAddToBelt = () => {
    if (!isInBelt && beltCards.length < maxBeltSize) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      addCardToBelt(cardData);
      if (onAddToBelt) {
        onAddToBelt(cardData);
      }
    }
  };

  return (
    <View>
      {/* Use Animated.View and apply RN styles */}
      <Animated.View
        style={[styles.cardBase, cardBorderStyle]} // Apply RN shadow/border styles
      >
        {/* Simplified Card Border/Background */}
        <View style={styles.cardBorder}>
          {/* Placeholder for border shine - animated opacity */}
          <Animated.View
            style={[
              styles.borderShineBase,
              {
                opacity: borderPhase.interpolate({ inputRange: [0, 50, 100], outputRange: [0.3, 0.7, 0.3] })
              }
            ]}
          />
        </View>

        {/* Card inner content container */}
        <View style={styles.innerContainer}>
          {/* Card Header */}
          <View style={[styles.headerBase, headerStyle]}>
            <Text style={styles.headerText}>{cardData.name}</Text>
            {/* Simplified header overlay */}
            <View style={styles.headerOverlay} />
          </View>

          {/* Pokemon Image Container - Now with grey background */}
          <View style={[styles.imageContainerBase, imageContainerStyle, { backgroundColor: 'grey' }]}>
            {/* Simplified Image overlay */}
            <View style={styles.imageOverlay} />
          </View>

          {/* Card Description */}
          <View style={[styles.descriptionBase, descriptionStyle]}>
            <Text style={styles.descriptionText}>
              {cardData.abilities.map((ability, index) => (
                <Text key={index}>
                  <Text style={styles.abilityName}>{ability.name}: </Text>
                  {ability.description}
                  {index < cardData.abilities.length - 1 ? '\n' : ''}
                </Text>
              ))}
            </Text>
            <View style={styles.statsContainer}>
              <Text style={styles.statText}>Attack: {cardData.attack}</Text>
              <Text style={styles.statText}>Defense: {cardData.defense}</Text>
            </View>
            <View style={styles.flavorContainer}>
              <Text style={styles.flavorText}>
                "{cardData.flavorText}"
              </Text>
            </View>
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Collector #{cardData.collectorNumber}</Text>
              <Text style={styles.footerText}>{cardData.rarity}</Text>
            </View>

            {/* Ability Status Indicators */}
            {isInBelt && (
              <View style={styles.abilityStatusContainer}>
                <Text style={styles.abilityStatusText}>Abilities Active</Text>
                <View style={styles.activeIndicator} />
              </View>
            )}
          </View>

          {/* Simplified Holographic Overlays */}
          <View style={styles.holoOverlay1} />
          <View style={styles.holoOverlay2} />
        </View>

        {/* Simplified Corner Sparkles */}
        {[0, 1, 2, 3].map(corner => (
          <Animated.View
            key={corner}
            style={[
              styles.sparkleBase,
              {
                top: corner < 2 ? -2 : undefined,
                bottom: corner >= 2 ? -2 : undefined,
                left: corner % 2 === 0 ? -2 : undefined,
                right: corner % 2 === 1 ? -2 : undefined,
                opacity: sparkleOpacity,
                // Simple shadow for sparkle
                ...Platform.select({
                  ios: {
                    shadowColor: '#fff',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 3,
                  },
                  android: {
                    elevation: 2,
                  },
                }),
              }
            ]}
          />
        ))}
      </Animated.View>

      {/* Add to Belt Button */}
      {!isInBelt && beltCards.length < maxBeltSize && (
        <TouchableOpacity 
          style={styles.addToBeltButton}
          onPress={handleAddToBelt}
        >
          <Text style={styles.addToBeltText}>Add to Belt</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Use StyleSheet for better organization and performance
const styles = StyleSheet.create({
  cardBase: {
    width: 256, // Corresponds to w-64
    height: 384, // Corresponds to h-96
    borderRadius: 12, // Corresponds to rounded-xl
    position: 'relative',
    // fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', // Example font
  },
  cardBorder: {
    position: 'absolute',
    inset: 0,
    borderRadius: 12, // Match parent
    overflow: 'hidden',
    backgroundColor: 'rgba(192, 132, 252, 0.8)', // purple-200 opacity-80
  },
  borderShineBase: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  innerContainer: {
    position: 'absolute',
    inset: 8, // Corresponds to inset-2 (assuming 1 unit = 4)
    backgroundColor: '#fef08a', // yellow-300
    borderRadius: 8, // Corresponds to rounded-lg
    overflow: 'hidden',
  },
  headerBase: {
    paddingHorizontal: 16, // px-4
    paddingTop: 8, // pt-2
    paddingBottom: 4, // pb-1
    position: 'relative',
  },
  headerText: {
    fontSize: 20, // text-xl
    fontWeight: 'bold', // font-bold
    color: 'white', // text-white
  },
  headerOverlay: {
    position: 'absolute',
    inset: 0,
    opacity: 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  imageContainerBase: {
    marginHorizontal: 16, // mx-4
    marginVertical: 8, // my-2
    height: 112, // h-32 -> reduced from 128
    borderRadius: 8, // rounded-lg
    display: 'flex', // Use flex for alignment
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
  },
  imageOverlay: {
    position: 'absolute',
    inset: 0,
    opacity: 0.2,
    borderRadius: 8, // rounded-lg
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  descriptionBase: {
    padding: 16, // p-4
    marginHorizontal: 8, // mx-2
    marginTop: 8, // mt-2
    marginBottom: 8, // mb-2
    flexGrow: 1, // flex-grow
    borderRadius: 8, // rounded-lg
    position: 'relative',
  },
  descriptionText: {
    fontSize: 14, // text-sm
    marginBottom: 12, // mb-3
    position: 'relative',
    zIndex: 10, // z-10
  },
  abilityName: {
    fontWeight: 'bold',
  },
  statsContainer: {
    marginBottom: 8, // mb-2
    flexDirection: 'row', // flex
    justifyContent: 'space-between', // justify-between
    position: 'relative',
    zIndex: 10,
  },
  statText: {
    fontWeight: 'bold', // font-bold
  },
  flavorContainer: {
    marginBottom: 4, // mb-1
    borderTopWidth: 1, // border-t
    borderColor: '#e5e7eb', // border-gray-200
    paddingTop: 8, // pt-2
    position: 'relative',
    zIndex: 10,
  },
  flavorText: {
    fontStyle: 'italic', // italic
    fontSize: 12, // text-xs
  },
  footerContainer: {
    flexDirection: 'row', // flex
    justifyContent: 'space-between', // justify-between
    alignItems: 'flex-end', // items-end
    position: 'relative',
    zIndex: 10,
  },
  footerText: {
    fontSize: 12, // text-xs
    color: '#6b7280', // text-gray-500
  },
  holoOverlay1: {
    position: 'absolute',
    inset: 0,
    opacity: 0.3,
    backgroundColor: 'rgba(128, 0, 128, 0.3)',
  },
  holoOverlay2: {
    position: 'absolute',
    inset: 0,
    opacity: 0.2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  sparkleBase: {
    position: 'absolute',
    width: 16, // w-4
    height: 16, // h-4
    zIndex: 20, // z-20
    backgroundColor: 'white',
    borderRadius: 8,
  },
  addToBeltButton: {
    backgroundColor: '#EC4899',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 12,
  },
  addToBeltText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  abilityStatusContainer: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 20,
  },
  abilityStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#10b981',
    marginRight: 4,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
});