import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
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
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  options,
  selectedValue,
  onSelect,
  placeholder = 'Select an option',
  width = 'w-40'
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const selectedOption = options.find(option => option.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

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
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={tw`flex-1 bg-black bg-opacity-30`}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={tw`flex-1 justify-start mt-20 mx-4`}>
            <View style={tw`bg-white rounded-lg overflow-hidden shadow-lg`}>
              <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={tw`px-4 py-3 border-b border-gray-100 ${
                      item.value === selectedValue ? 'bg-red-50' : ''
                    }`}
                    onPress={() => {
                      onSelect(item.value);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={tw`${
                      item.value === selectedValue ? 'text-red-600 font-bold' : 'text-gray-800'
                    }`}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
                style={tw`max-h-80`}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default FilterDropdown;
