import React, { useRef, useCallback, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/components/CustomText';
import BottomSheet, { BottomSheetBackdrop,BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { FilterType } from '@/app/(tabs)/_layout';
import tw from '@/utils/tw';
import FilterDropdown from './FilterDropdown';
import { Ionicons } from '@expo/vector-icons';

interface FilterBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  sortFilter?: string;
  locationFilter?: string;
  neighborhoodFilter?: string;
  onFilterChange?: (filterType: keyof FilterType, value: string) => void;
  neighborhoodOptions?: { label: string; value: string }[];
  showNeighborhoodFilter?: boolean;
  setSearchModalVisible?: (value: boolean) => void;
}

const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  isVisible,
  onClose,
  sortFilter = 'all',
  locationFilter = 'all_nyc',
  neighborhoodFilter = 'all',
  onFilterChange = () => {},
  neighborhoodOptions = [],
  showNeighborhoodFilter = false,
  setSearchModalVisible
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  
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

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  if (!isVisible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isVisible ? 1 : -1}
      snapPoints={['50%']}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
    >
      <BottomSheetScrollView contentContainerStyle={tw`pb-10`}>
        <View style={tw`p-4 border-b border-gray-200`}>
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text style={tw`text-lg font-bold`}>Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={tw`text-pink-500`}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={tw`flex-col justify-between`}>
            <View style={tw`flex-row justify-between mb-4`}>
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
              <View style={tw`w-full mb-4`}>
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

          <View style={tw`flex-row justify-between items-center mt-4`}>
            <Text style={tw`text-lg font-bold`}>Search</Text> 
          </View>
            <TouchableOpacity 
              onPress={() => {
                onClose();
                setSearchModalVisible?.(true)
                
              }}
              style={tw`flex-row items-center justify-center bg-pink-500 rounded-md py-3 px-4 mt-4`}
            >
              <Ionicons name="search" size={20} color="white" style={tw`mr-2`} />
              <Text style={tw`text-white font-medium`}>Search Place</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomSheet: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  indicator: {
    backgroundColor: '#CCCCCC',
    width: 40,
  }
});

export default FilterBottomSheet;
