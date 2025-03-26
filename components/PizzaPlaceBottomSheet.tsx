import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, FlatList } from 'react-native';
import { Text, Heading, Subheading, Paragraph, Caption } from '@/components/CustomText';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import tw from '@/utils/tw';
import { PlaceResult } from '@/utils/placesApi';
import { Review, getReviewsForPlace, addReview } from '@/utils/mockReviewsData';
import { AntDesign } from '@expo/vector-icons';
import ReviewSheet from './ReviewSheet';

interface PizzaPlaceBottomSheetProps {
  place: PlaceResult | null;
  isVisible: boolean;
  onClose: () => void;
}

const PizzaPlaceBottomSheet: React.FC<PizzaPlaceBottomSheetProps> = ({
  place,
  isVisible,
  onClose
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSheetVisible, setReviewSheetVisible] = useState(false);

  // Snappoints for the bottom sheet (percentage of screen height)
  const snapPoints = useMemo(() => ['25%', '50%', '85%'], []);

  // Load reviews when place changes
  React.useEffect(() => {
    if (place) {
      const placeReviews = getReviewsForPlace(place.place_id);
      setReviews(placeReviews);
    }
  }, [place]);

  // Handle sheet changes
  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  // Render backdrop
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );

  // Submit a new review
  const handleSubmitReview = (rating: number, comment: string) => {
    if (!place) return;
    
    // In a real app, we would get the user's name from their profile
    // For now, we'll use a placeholder name
    const userName = "Pizzarat User"; // This would come from user profile in a real app
    
    const newReview = addReview({
      placeId: place.place_id,
      userName,
      rating: rating / 2, // Convert from 10-point scale to 5-point scale for consistency with existing data
      comment,
      userProfilePic: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 50)}.jpg`
    });
    
    setReviews([newReview, ...reviews]);
  };

  // Render rating score
  const renderRatingScore = (rating: number) => {
    // Convert 5-star rating to 10-point scale
    const score = (rating * 2).toFixed(1);
    
    // Determine color based on score
    let color = "#ef4444"; // red
    if (parseFloat(score) >= 8.0) color = "#22c55e"; // green
    else if (parseFloat(score) >= 6.0) color = "#eab308"; // yellow
    else if (parseFloat(score) >= 4.0) color = "#f97316"; // orange
    
    return (
      <View style={tw`flex-row items-center`}>
        <Text style={[tw`text-lg font-bold mr-1`, { color }]}>{score}</Text>
        <Text style={tw`text-gray-500 text-sm`}>/ 10.0</Text>
      </View>
    );
  };

  // No longer needed as we're using the ReviewSheet component

  // Render a review item
  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={tw`p-4 border-b border-gray-200`}>
      <View style={tw`flex-row items-center mb-2`}>
        {item.userProfilePic && (
          <Image
            source={{ uri: item.userProfilePic }}
            style={tw`w-10 h-10 rounded-full mr-3`}
          />
        )}
        <View>
          <Text style={tw`font-bold text-base`}>{item.userName}</Text>
          <View style={tw`flex-row items-center`}>
            {renderRatingScore(item.rating)}
            <Text style={tw`text-xs text-gray-500 ml-2`}>{item.date}</Text>
          </View>
        </View>
      </View>
      <Text style={tw`text-sm text-gray-700`}>{item.comment}</Text>
    </View>
  );

  // If no place is selected, don't render anything
  if (!place || !isVisible) {
    return null;
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isVisible ? 1 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
    >
      <BottomSheetScrollView contentContainerStyle={tw`pb-10`}>
        {/* Pizza Place Header */}
        <View style={tw`p-4 border-b border-gray-200`}>
          <Text style={tw`text-xl font-bold text-red-600`}>{place.name}</Text>
          <Text style={tw`text-gray-600 mb-2`}>{place.vicinity}</Text>
          
          <View style={tw`flex-row items-center mb-2`}>
            {renderRatingScore(place.rating || 0)}
            <Text style={tw`ml-2 text-gray-600`}>
              (<Text>{place.user_ratings_total || 0}</Text> reviews)
            </Text>
          </View>
          
          {place.price_level && (
            <Text style={tw`text-sm mb-2`}>
              Price: <Text>{"$".repeat(place.price_level)}</Text>
            </Text>
          )}
          
          {place.opening_hours && (
            <Text style={[tw`text-sm`, place.opening_hours.open_now ? tw`text-green-600` : tw`text-red-600`]}>
              {place.opening_hours.open_now ? 'Open Now' : 'Closed'}
            </Text>
          )}
        </View>
        
        {/* Review Section */}
        <View style={tw`p-4 border-b border-gray-200`}>
          <View style={tw`items-center mb-6 mt-2`}>
            <TouchableOpacity 
              style={tw`bg-red-600 py-3 px-6 rounded-xl w-4/5`}
              onPress={() => setReviewSheetVisible(true)}
            >
              <Text style={tw`text-white font-bold text-center text-lg`}>
                LEAVE A REVIEW
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={tw`flex-row justify-between items-center mb-4 px-4`}>
            <Text style={tw`text-lg font-bold`}>Reviews</Text>
            <Text style={tw`text-gray-500`}><Text>{reviews.length}</Text> reviews</Text>
          </View>
          
          {/* Reviews List */}
          {reviews.length > 0 ? (
            <FlatList
              data={reviews}
              renderItem={renderReviewItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={tw`py-4 items-center`}>
              <Text style={tw`text-gray-500`}>No reviews yet. Be the first to review!</Text>
            </View>
          )}
        </View>
      </BottomSheetScrollView>
      
      {/* Full-screen Review Sheet */}
      <ReviewSheet 
        visible={reviewSheetVisible}
        onClose={() => setReviewSheetVisible(false)}
        onSubmit={handleSubmitReview}
        placeName={place?.name || ''}
      />
    </BottomSheet>
  );
};

export default PizzaPlaceBottomSheet;
