import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  TextInput, 
  ActivityIndicator,
  Keyboard,
  StyleSheet
} from 'react-native';
import { Text } from '@/components/CustomText';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import tw from '@/utils/tw';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  width?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  options,
  selectedValue,
  onSelect,
  placeholder = 'Select an option',
  width = 'w-40',
  searchable = false,
  searchPlaceholder = 'Search...'
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<FilterOption[]>(options);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  
  const selectedOption = options.find(option => option.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  // Filter options based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOptions(options);
      return;
    }

    setIsLoading(true);

    const filtered = options.filter(option => 
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredOptions(filtered);
    setIsLoading(false);
  }, [searchQuery, options]);

  // Focus search input when modal opens
  useEffect(() => {
    if (modalVisible && searchable) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [modalVisible, searchable]);

  // Reset search when modal closes
  const handleCloseModal = () => {
    setModalVisible(false);
    setSearchQuery('');
    Keyboard.dismiss();
  };

  // Clear search query
  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  return (
    <View style={tw`${width} z-10`}>
      <TouchableOpacity
        style={tw`flex-row items-center justify-between bg-white rounded-md px-3 py-2 border border-gray-300`}
        onPress={() => setModalVisible(true)}
      >
        <Text style={tw`text-gray-800 font-medium`} numberOfLines={1}>
          {displayText}
        </Text>
        <AntDesign name="down" size={12} color="#666" />
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity
          style={tw`flex-1 bg-black bg-opacity-30`}
          activeOpacity={1}
          onPress={handleCloseModal}
        >
          <View style={tw`flex-1 justify-start mt-20 mx-4`}>
            <View style={tw`bg-white rounded-lg overflow-hidden shadow-lg`}>
              {searchable && (
                <View style={tw`px-4 py-2 border-b border-gray-200 flex-row items-center`}>
                  <View style={tw`flex-1 flex-row items-center bg-gray-100 rounded-md px-2`}>
                    <Ionicons name="search" size={16} color="#666" />
                    <TextInput
                      ref={searchInputRef}
                      style={{ ...tw`flex-1 py-2 px-2 text-gray-800`, fontFamily: 'Zodiak' }}
                      placeholder={searchPlaceholder}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      returnKeyType="search"
                      clearButtonMode="while-editing"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>
              )}

              {isLoading ? (
                <View style={tw`py-4 items-center`}>
                  <ActivityIndicator size="small" color="#EC4899" />
                </View>
              ) : filteredOptions.length === 0 ? (
                <View style={tw`py-4 items-center`}>
                  <Text style={tw`text-gray-500`}>No results found</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredOptions}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={tw`px-4 py-3 border-b border-gray-100 ${
                        item.value === selectedValue ? 'bg-red-50' : ''
                      }`}
                      onPress={() => {
                        onSelect(item.value);
                        handleCloseModal();
                      }}
                    >
                      <Text 
                        style={tw`${
                          item.value === selectedValue ? 'text-red-600 font-bold' : 'text-gray-800'
                        }`}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                  style={styles.flatList}
                />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  flatList: {
    maxHeight: 300
  }
});

export default FilterDropdown;