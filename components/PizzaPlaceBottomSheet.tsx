import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, FlatList } from 'react-native';
import { Text, Heading, Subheading, Paragraph, Caption } from '@/components/CustomText';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import tw from '@/utils/tw';
import { PlaceResult } from '@/utils/placesApi';
import { getReviewsForPlace } from '@/utils/mockReviewsData';
import { AntDesign } from '@expo/vector-icons';
import ReviewSheet from './ReviewSheet';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface PizzaPlaceBottomSheetProps {
  place: PlaceResult | null;
  isVisible: boolean;
  onClose: () => void;
}

interface Review {
  id: string;
  placeId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  userProfilePic: string;
  date: string;
}

const PizzaPlaceBottomSheet: React.FC<PizzaPlaceBottomSheetProps> = ({
  place,
  isVisible,
  onClose
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSheetVisible, setReviewSheetVisible] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  // Snappoints for the bottom sheet (percentage of screen height)
  const snapPoints = useMemo(() => ['25%', '50%', '85%'], []);

  // Load initial reviews
  useEffect(() => {
    const loadReviews = async () => {
      if (!place) return;
      
      // Clear previous user review when place changes
      setUserReview(null);
      
      try {
        // Get current user's session
        const { data: { session } } = await supabase.auth.getSession();
        
        // Fetch reviews from Supabase
        const { data: reviewData, error } = await supabase
          .from('Review')
          .select(`
            *,
            Users!userId (
              name,
              email
            )
          `)
          .eq('placeId', place.place_id)
          .order('createdAt', { ascending: false });

        if (error) {
          console.error('Error fetching reviews:', error);
          return;
        }

        // Transform the data to match our Review interface
        const transformedReviews: Review[] = (reviewData || []).map(review => {
          const user = Array.isArray(review.Users) ? review.Users[0] : review.Users;
          const transformedReview = {
            id: review.id,
            placeId: review.placeId,
            userId: review.userId,
            userName: user?.name || user?.email || 'Anonymous',
            rating: review.rate,
            comment: review.content,
            userProfilePic: user?.avatar || '',
            date: review.createdAt
          };

          // Store user's review if found
          if (session?.user && review.userId === session.user.id) {
            setUserReview(transformedReview);
          }

          return transformedReview;
        });

        setReviews(transformedReviews);
      } catch (error) {
        console.error('Error loading reviews:', error);
      }
    };

    loadReviews();
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

  // Submit or update a review
  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!place) return;
    
    try {
      // Get the current user's session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.error('User must be logged in to submit a review');
        return;
      }

      if (userReview) {
        // Update existing review's rating
        const { data: updatedReview, error } = await supabase
          .from('Review')
          .update({
            rate: rating / 2, // Convert from 10-point scale to 5-point scale
            updatedAt: new Date().toISOString()
          })
          .eq('id', userReview.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating review:', error);
          return;
        }

        // Update the reviews list with the updated rating
        setReviews(reviews.map(review => 
          review.id === userReview.id 
            ? { ...review, rating: rating / 2 }
            : review
        ));

        setUserReview(prev => prev ? { ...prev, rating: rating / 2 } : null);
      } else {
        // Insert new review
        const { data: newReview, error } = await supabase
          .from('Review')
          .insert({
            id: new Date().getTime(),
            rate: rating / 2,
            content: comment,
            placeId: place.place_id,
            userId: session.user.id,
            updatedAt: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Error submitting review:', error);
          return;
        }

        // Add the new review to the list
        if (newReview) {
          const reviewWithUser = {
            id: newReview.id,
            placeId: newReview.placeId,
            userId: session.user.id,
            userName: session.user.email || 'Anonymous',
            rating: rating / 2,
            comment,
            userProfilePic: '',
            date: newReview.createdAt
          };
          setReviews([reviewWithUser, ...reviews]);
          setUserReview(reviewWithUser);
        }
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }
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

  // Get initials from email or name
  const getInitials = (name: string) => {
    if (!name || name === 'Anonymous') return 'A';
    return name
      .split('@')[0] // Get part before @ in email
      .split(/\s+/) // Split by whitespace
      .map(word => word[0]?.toUpperCase() || '') // Get first letter of each word
      .slice(0, 2) // Take first two initials
      .join(''); // Join them together
  };

  // Render a circular profile with initials
  const ProfileCircle = ({ name, size = 40 }: { name: string; size?: number }) => {
    const initials = getInitials(name);
    const bgColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
    // Use a hash of the name to consistently pick a color
    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % bgColors.length;
    const bgColor = bgColors[colorIndex];

    return (
      <View
        style={[
          tw`rounded-full items-center justify-center`,
          {
            width: size,
            height: size,
            backgroundColor: bgColor
          }
        ]}
      >
        <Text style={tw`text-white font-bold text-base`}>{initials}</Text>
      </View>
    );
  };

  // Render a review item
  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={tw`p-4 border-b border-gray-200`}>
      <View style={tw`flex-row items-center mb-2`}>
        <ProfileCircle name={item.userName} size={40} />
        <View style={tw`ml-3 flex-1`}>
          <Text style={tw`font-bold text-base text-gray-800`}>{item.userName}</Text>
          <Text style={tw`text-sm text-gray-500`}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
        {renderRatingScore(item.rating)}
      </View>
      <Text style={tw`text-gray-700 mt-1`}>{item.comment}</Text>
    </View>
  );

  // Render review button or edit rating based on whether user has already reviewed
  const renderReviewButton = () => (
    <TouchableOpacity 
      style={tw`bg-red-600 py-3 px-6 rounded-xl w-4/5 mb-3`}
      onPress={() => setReviewSheetVisible(true)}
    >
      <View style={tw`flex-row items-center justify-center`}>
        <AntDesign name={userReview ? "edit" : "star"} size={20} color="#FFFFFF" style={tw`mr-2`} />
        <Text style={tw`text-white font-bold text-lg`}>
          {userReview ? "EDIT RATING" : "WRITE REVIEW"}
        </Text>
      </View>
    </TouchableOpacity>
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
            {renderReviewButton()}
            <TouchableOpacity 
              style={tw`bg-blue-600 py-3 px-6 rounded-xl w-4/5`}
              onPress={() => router.push({
                pathname: "/(tabs)/chat",
                params: { placeId: place?.id || '' }
              })}
            >
              <Text style={tw`text-white font-bold text-center text-lg`}>
                CHAT ROOM
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
        placeName={place.name}
        initialRating={userReview ? userReview.rating * 2 : 7.0} 
        initialComment={userReview?.comment || ''}
        isEditMode={!!userReview}
      />
    </BottomSheet>
  );
};

export default PizzaPlaceBottomSheet;
