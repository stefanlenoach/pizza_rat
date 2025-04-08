import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/utils/tw';
import FilterDropdown from './FilterDropdown';

interface PizzaRatHeaderProps {
  showFilters?: boolean;
  onFilterChange?: (filterType: string, value: string) => void;
  sortFilter?: string;
  locationFilter?: string;
  rightIcon?: React.ReactNode;
}

const PizzaRatHeader: React.FC<PizzaRatHeaderProps> = ({ 
  showFilters = false,
  onFilterChange = () => {},
  sortFilter = "best",
  locationFilter = "near_me",
  rightIcon
}) => {
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  // Sort filter options
  const sortOptions = [
    { label: 'Best Rated', value: 'best' },
    { label: 'Worst Rated', value: 'worst' },
    { label: 'Newest', value: 'new' },
    { label: 'Oldest', value: 'old' },
    { label: 'Cheapest', value: 'cheap' },
    { label: 'Most Expensive', value: 'expensive' }
  ];

  // Location filter options
  const locationOptions = [
    { label: 'Near Me', value: 'near_me' },
    { label: 'Brooklyn', value: 'brooklyn' },
    { label: 'Bronx', value: 'bronx' },
    { label: 'Staten Island', value: 'staten_island' },
    { label: 'Queens', value: 'queens' },
    { label: 'Manhattan', value: 'manhattan' },
    { label: 'All NYC', value: 'all_nyc' }
  ];
  
  return (
    <SafeAreaView style={[tw`absolute top-0 left-0 right-0 z-50`, styles.container]}>
      <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
      <View style={tw`justify-center px-4 pt-2 pb-2`}>
        <View style={tw`flex-row justify-between items-center mb-1`}>
          <View style={tw`flex-row items-center`}>
            {showFilters && (
              <TouchableOpacity 
                onPress={() => setIsFiltersVisible(!isFiltersVisible)}
                style={tw`p-2 -ml-2`}
              >
                <Ionicons 
                  name={isFiltersVisible ? "funnel" : "funnel-outline"} 
                  size={20} 
                  color="#EC4899"
                />
              </TouchableOpacity>
            )}
          </View>
          {rightIcon}
        </View>
        
        {showFilters && isFiltersVisible && (
          <View style={tw`flex-row justify-between mt-2`}>
            <FilterDropdown 
              options={sortOptions}
              selectedValue={sortFilter}
              onSelect={(value) => onFilterChange('sort', value)}
              width="w-[48%]"
            />
            <FilterDropdown 
              options={locationOptions}
              selectedValue={locationFilter}
              onSelect={(value) => onFilterChange('location', value)}
              width="w-[48%]"
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  }
});

export default PizzaRatHeader;
