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
  rate: number;
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
  const [isLoading, setIsLoading] = useState(false);

  // Snappoints for the bottom sheet (percentage of screen height)
  const snapPoints = useMemo(() => ['25%', '50%', '85%'], []);

  // Fetch reviews for the current place
  const fetchReviews = async () => {
    if (!place?.place_id) return;
    
    setIsLoading(true);
    try {
      // Get current user's session
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data: reviewsData, error } = await supabase
        .from('Review')
        .select(`
          *,
          Users (
            id,
            email,
            name,
            avatar
          )
        `)
        .eq('placeId', place.place_id)
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        return;
      }

      // Transform the data to match our Review type
      const transformedReviews = await Promise.all((reviewsData || []).map(async (review) => {
        const user = review.Users;
        
        // Find the user's review
        if (session?.user?.id === review.userId) {
          setUserReview({
            id: review.id,
            placeId: review.placeId,
            userId: review.userId,
            userName: user?.name || user?.email || 'Anonymous',
            rate: review.rate,
            comment: review.content,
            userProfilePic: user?.avatar || '',
            date: review.createdAt
          });
        }

        return {
          id: review.id,
          placeId: review.placeId,
          userId: review.userId,
          userName: user?.name || user?.email || 'Anonymous',
          rate: review.rate,
          comment: review.content,
          userProfilePic: user?.avatar || '',
          date: review.createdAt
        };
      }));

      setReviews(transformedReviews);
    } catch (error) {
      console.error('Error in fetchReviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch reviews when place changes
  useEffect(() => {
    if (place?.place_id) {
      fetchReviews();
    }
    
    // Cleanup function to clear reviews when component unmounts or place changes
    return () => {
      setReviews([]);
      setUserReview(null);
      setIsLoading(false);
    };
  }, [place?.place_id]);

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
            ? { ...review, rate: rating / 2 }
            : review
        ));

        setUserReview(prev => prev ? { ...prev, rate: rating / 2 } : null);
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
            rate: rating / 2,
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

  // Calculate average rating from fetched reviews
  const calculateAverageRating = (reviews: any[]) => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rate, 0);
    return Number((sum / reviews.length).toFixed(1)); // Round to 1 decimal place
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
        {renderRatingScore(item.rate)}
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
 

  const averageRating = calculateAverageRating(reviews);

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
            {renderRatingScore(averageRating)}
            <Text style={tw`ml-2 text-gray-600`}>
              (<Text>{reviews?.length || 0}</Text> reviews)
            </Text>
          </View>
          
          {place.price_level && (
            <Text style={tw`text-sm mb-2`}>
              Price: <Text>{"$".repeat(place.price_level)}</Text>
            </Text>
          )}
          
          {place.regularOpeningHours && (
            <> 
              {place.regularOpeningHours?.weekdayDescriptions && (
                <View style={tw`mt-2 bg-gray-50 p-3 rounded-lg`}>
                  <Text style={tw`text-sm font-semibold mb-2`}>Opening Hours:</Text>
                  {place.regularOpeningHours.weekdayDescriptions.map((day: string, index: number) => (
                    <Text key={index} style={tw`text-sm text-gray-600 mb-1`}>
                      {day}
                    </Text>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
        
        {/* Review Section */}
        <View style={tw`p-4 border-b border-gray-200`}>
          <View style={tw`items-center mb-6 mt-2`}>
            {renderReviewButton()}
            <TouchableOpacity 
              style={tw`bg-blue-600 py-3 px-6 rounded-xl w-4/5 mt-4`}
              onPress={() => router.push({
                pathname: "/(tabs)/chat",
                params: { placeId: place?.place_id || '' }
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
        initialRating={userReview ? userReview.rate * 2 : 7.0} 
        initialComment={userReview?.comment || ''}
        isEditMode={!!userReview}
      />
    </BottomSheet>
  );
};

export default PizzaPlaceBottomSheet;
