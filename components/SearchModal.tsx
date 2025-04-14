import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/components/CustomText';
import { Ionicons } from '@expo/vector-icons';
import { PlaceResult } from '@/utils/placesApi';
import debounce from 'lodash/debounce';
import tw from '@/utils/tw';

interface SearchModalProps {
  isVisible: boolean;
  onClose: () => void;
  places: PlaceResult[];
  onSelectPlace: (place: PlaceResult) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({
  isVisible,
  onClose,
  places,
  onSelectPlace,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
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
  }, [searchQuery, debouncedSearch]);

  const handleSelectPlace = (place: PlaceResult) => {
    onSelectPlace(place);
    setSearchQuery('');
    onClose();
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
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FF5A5F" />
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    marginRight: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#fff',
    fontSize: 16,
  },
  resultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  placeName: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    color: '#FF5A5F',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});
