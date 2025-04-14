import React, { Fragment, useState, useEffect } from 'react';
import { View, SafeAreaView, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/components/CustomText';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/utils/tw';
import FilterDropdown from './FilterDropdown';
import { FilterType } from '@/app/(tabs)/_layout';
import { useUser } from '@/contexts/UserContext';
import { getAllNeighborhoods } from '@/utils/brooklynPizzaData';

interface PizzaRatHeaderProps {
  showFilters?: boolean;
  onFilterChange?: (filterType: keyof FilterType, value: string) => void;
  sortFilter?: string;
  locationFilter?: string;
  neighborhoodFilter?: string;
  rightIcon?: React.ReactNode;
}

const PizzaRatHeader: React.FC<PizzaRatHeaderProps> = ({ 
  showFilters = false,
  onFilterChange = () => {},
  sortFilter = "all",
  locationFilter = "all_nyc",
  neighborhoodFilter = "all",
  rightIcon
}) => {
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const { searchModalVisible, setSearchModalVisible } = useUser();
  const [neighborhoodOptions, setNeighborhoodOptions] = useState<{label: string, value: string}[]>([
    { label: 'All Neighborhoods', value: 'all' }
  ]);
  const [showNeighborhoodFilter, setShowNeighborhoodFilter] = useState(false);

  // Load neighborhoods based on the selected borough
  useEffect(() => {
    const loadNeighborhoods = async () => {
      try {
        if (locationFilter === 'all_nyc' || locationFilter === 'all') {
          setShowNeighborhoodFilter(false);
          return;
        }
        
        // Get neighborhoods for the selected borough
        const neighborhoods = await getAllNeighborhoods();
        
        // Filter neighborhoods by the selected borough
        // This will need to be implemented based on how your data is structured
        // For now, we'll just show all neighborhoods
        
        const options = [
          { label: 'All Neighborhoods', value: 'all' },
          ...neighborhoods.map(neighborhood => ({
            label: neighborhood,
            value: neighborhood
          }))
        ];
        
        setNeighborhoodOptions(options);
        setShowNeighborhoodFilter(true);
      } catch (error) {
        console.error('Error loading neighborhoods:', error);
        setShowNeighborhoodFilter(false);
      }
    };
    
    loadNeighborhoods();
  }, [locationFilter]);

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
            <TouchableOpacity 
                onPress={() => setSearchModalVisible(true)}
                style={tw`p-2 -ml-2`}
              >
                <Ionicons name="search" size={24} color="#EC4899" />
              </TouchableOpacity>
          </View>
          {rightIcon}
        </View>
        
        {showFilters && isFiltersVisible && (
          <View style={tw`flex-col justify-between mt-2`}>
            <View style={tw`flex-row justify-between mb-2`}>
              <FilterDropdown 
                options={sortOptions}
                selectedValue={sortFilter}
                onSelect={(value) => onFilterChange('sort', value)}
                width="w-[48%]"
              />
              <FilterDropdown 
                options={locationOptions}
                selectedValue={locationFilter}
                onSelect={(value) => {
                  onFilterChange('location', value);
                  // Reset neighborhood when borough changes
                  onFilterChange('neighborhood', 'all');
                }}
                width="w-[48%]"
              />
            </View>
            
            {/* Neighborhood filter - only shown when a specific borough is selected */}
            {showNeighborhoodFilter && (
              <View style={tw`w-full`}>
                <FilterDropdown 
                  options={neighborhoodOptions}
                  selectedValue={neighborhoodFilter}
                  onSelect={(value) => onFilterChange('neighborhood', value)}
                  width="w-full"
                  placeholder="Select Neighborhood"
                  searchable={true}
                  searchPlaceholder="Search neighborhoods..."
                />
              </View>
            )}
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