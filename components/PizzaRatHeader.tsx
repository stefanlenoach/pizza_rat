import React, { useState } from 'react';
import { View, SafeAreaView, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/components/CustomText';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/utils/tw';
import FilterDropdown from './FilterDropdown';
import { FilterType } from '@/app/(tabs)/_layout';

interface PizzaRatHeaderProps {
  showFilters?: boolean;
  onFilterChange?: (filterType: keyof FilterType, value: string) => void;
  sortFilter?: string;
  locationFilter?: string;
  rightIcon?: React.ReactNode;
}

const PizzaRatHeader: React.FC<PizzaRatHeaderProps> = ({ 
  showFilters = false,
  onFilterChange = () => {},
  sortFilter = "all",
  locationFilter = "all_nyc",
  rightIcon
}) => {
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  // Sort filter options
  const sortOptions = [
    { label: 'All', value: 'all' },
    { label: 'Best', value: 'best' },
    { label: 'Worst', value: 'worst' }, 
    { label: 'Cheap', value: 'cheap' },
    { label: 'Popular', value: 'popular' }
  ];

  // Location filter options
  const locationOptions = [
    { label: 'All NYC', value: 'all_nyc' },
    { label: 'Brooklyn', value: 'brooklyn' },
    { label: 'Bronx', value: 'bronx' },
    { label: 'Staten Island', value: 'staten_island' },
    { label: 'Queens', value: 'queens' },
    { label: 'Manhattan', value: 'manhattan' }, 
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
