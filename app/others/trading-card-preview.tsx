import React from 'react';
import { View, StyleSheet } from 'react-native';
import PokemonCard from '@/components/TradingCards/baseCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/useThemeColor'; 

export default function TradingCardPreviewScreen() {
  const backgroundColor = useThemeColor({}, 'background'); 

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={styles.container}>
        <PokemonCard />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
