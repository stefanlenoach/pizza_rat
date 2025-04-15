import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/components/CustomText';
import { Ionicons } from '@expo/vector-icons';
import { PlaceResult } from '@/utils/placesApi';
import debounce from 'lodash/debounce';
import tw from '@/utils/tw';
import { useUser } from '@/contexts/UserContext';

interface SearchModalProps {
  isVisible: boolean;
  onClose: () => void;
  places: PlaceResult[];
  onSelectPlace: (place: PlaceResult) => void;
  onClear: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({
  isVisible,
  onClose,
  places,
  onSelectPlace,
  onClear
}) => {
  const { searchQuery, setSearchQuery, setSelectedSearchPlace } = useUser();
  const [filteredPlaces, setFilteredPlaces] = useState<PlaceResult[]>([]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (!query.trim()) {
        setFilteredPlaces([]);
        return;
      }

      const results = places.filter(place =>
        place.name.toLowerCase().includes(query.toLowerCase()) ||
        (place.vicinity && place.vicinity.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredPlaces(results);
    }, 300),
    [places]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, places]);

  const handleSelectPlace = (place: PlaceResult) => {
    setSelectedSearchPlace(place);
    onSelectPlace(place); 
    onClose();
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedSearchPlace(null);
    setFilteredPlaces([]); 
    onClear();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={onClose} style={tw`p-2`}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search pizza places..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
                placeholderTextColor="#666"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={handleClear} style={tw`p-2`}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <FlatList
            data={filteredPlaces}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => handleSelectPlace(item)}
              >
                <Text style={styles.placeName}>{item.name}</Text>
                <Text style={styles.placeAddress}>{item.vicinity}</Text> 
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              searchQuery.trim() ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No places found</Text>
                </View>
              ) : null
            }
          />
        </View>
      </View>
    </Modal>
  );
};

export default SearchModal;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalContent: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 50,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginLeft: 10,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#000',
    fontSize: 16,
    marginLeft: 10,
  },
  searchIcon: {
    marginRight: 5,
  },
  resultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  placeName: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
});
