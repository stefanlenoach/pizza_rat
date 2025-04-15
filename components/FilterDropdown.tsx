import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Dimensions,
  LayoutRectangle,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/utils/tw';

interface FilterDropdownProps {
  options: { label: string; value: string }[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  width?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  isLoading?: boolean;
}

export default function FilterDropdown({
  options,
  selectedValue,
  onSelect,
  placeholder = 'Select an option',
  width = 'w-full',
  searchable = false,
  searchPlaceholder = 'Search...',
  isLoading = false,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [buttonLayout, setButtonLayout] = useState<LayoutRectangle | null>(null);
  const buttonRef = useRef<View>(null);
  const windowHeight = Dimensions.get('window').height;
  const minWidth = 200;

  const selectedOption = options.find((opt) => opt.value === selectedValue);
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCloseModal = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  const measureButton = () => {
    if (buttonRef.current) {
      buttonRef.current.measureInWindow((x, y, width, height) => {
        setButtonLayout({ x, y, width, height });
      });
    }
  };

  const getDropdownPosition = () => {
    if (!buttonLayout) return {};

    const spaceBelow = windowHeight - buttonLayout.y - buttonLayout.height;
    const spaceAbove = buttonLayout.y;
    const showBelow = spaceBelow >= 200 || spaceBelow >= spaceAbove;

    return {
      position: 'absolute' as const,
      top: showBelow ? buttonLayout.height : undefined,
      bottom: !showBelow ? buttonLayout.height : undefined,
      left: 0,
      right: 0,
      maxHeight: showBelow ? Math.min(spaceBelow - 10, 300) : Math.min(spaceAbove - 10, 300),
      backgroundColor: 'white',
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      zIndex: 1000,
    };
  };

  return (
    <View ref={buttonRef} style={tw`${width}`} onLayout={measureButton}>
      <TouchableOpacity
        style={tw`flex-row items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-2`}
        onPress={() => {
          measureButton();
          setIsOpen(true);
        }}
      >
        <Text style={tw`flex-1 text-sm ${selectedValue ? 'text-black' : 'text-gray-500'}`} numberOfLines={1}>
          {selectedOption?.label || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" style={tw`ml-2`} />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="none">
        <TouchableOpacity 
          style={[tw`flex-1`, { backgroundColor: 'rgba(0,0,0,0.1)' }]} 
          onPress={handleCloseModal} 
          activeOpacity={1}
        >
          {buttonLayout && (
            <View style={[tw`absolute`, { top: buttonLayout.y, left: buttonLayout.x, width: buttonLayout.width }]}>
              <View style={getDropdownPosition()}>
                {searchable && (
                  <View style={tw`p-2 border-b border-gray-100`}>
                    <View style={tw`flex-row items-center bg-gray-50 rounded-lg px-3`}>
                      <Ionicons name="search" size={16} color="#666" />
                      <TextInput
                        style={tw`flex-1 py-2 px-2 text-sm`}
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
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
                  />
                )}
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}