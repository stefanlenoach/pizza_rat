import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import tw from '@/utils/tw';
import FilterDropdown from './FilterDropdown';

interface PizzaRatHeaderProps {
  title?: string;
  showFilters?: boolean;
  onFilterChange?: (filterType: string, value: string) => void;
  sortFilter?: string;
  locationFilter?: string;
}

const PizzaRatHeader: React.FC<PizzaRatHeaderProps> = ({ 
  title = "PizzaRat NYC", 
  showFilters = false,
  onFilterChange = () => {},
  sortFilter = "best",
  locationFilter = "near_me"
}) => {
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
    <SafeAreaView style={tw`bg-[#0E1010]`}>
      <View style={tw`justify-center px-4 pt-2 pb-2`}>
        <Text style={tw`text-pink-300 text-xl font-bold mb-1`}>{title}</Text>
        
        {showFilters && (
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

export default PizzaRatHeader;
