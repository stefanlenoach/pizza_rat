import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Animated, 
  Modal,
  SafeAreaView,
  Dimensions,
  Keyboard,
  Platform,
  TouchableWithoutFeedback
} from 'react-native';
import { Text, Heading, Subheading, Paragraph, Caption } from '@/components/CustomText';
import { AntDesign } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import tw from '@/utils/tw';

interface ReviewSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  placeName: string;
}

const ReviewSheet: React.FC<ReviewSheetProps> = ({
  visible,
  onClose,
  onSubmit,
  placeName
}) => {
  const [rating, setRating] = useState(7.0);
  const [comment, setComment] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Handle keyboard appearance
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // Animation when sheet becomes visible
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: Dimensions.get('window').height,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  // Increment rating by 0.1 with haptic feedback
  const incrementRating = () => {
    if (rating < 10.0) {
      // Provide light haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRating(parseFloat((rating + 0.1).toFixed(1)));
      
      // Provide medium haptic feedback at milestone ratings
      if ([5.0, 7.0, 9.0, 10.0].includes(parseFloat((rating + 0.1).toFixed(1)))) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } else {
      // Provide notification feedback when reaching max
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  // Decrement rating by 0.1 with haptic feedback
  const decrementRating = () => {
    if (rating > 0.0) {
      // Provide light haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRating(parseFloat((rating - 0.1).toFixed(1)));
      
      // Provide medium haptic feedback at milestone ratings
      if ([1.0, 3.0, 5.0, 7.0].includes(parseFloat((rating - 0.1).toFixed(1)))) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } else {
      // Provide notification feedback when reaching min
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  // Handle review submission with haptic feedback
  const handleSubmit = () => {
    // Provide success haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    onSubmit(rating, comment);
    setRating(7.0);
    setComment('');
    onClose();
  };

  // Get color based on rating
  const getRatingColor = () => {
    if (rating >= 8.0) return '#22c55e'; // green
    if (rating >= 6.0) return '#eab308'; // yellow
    if (rating >= 4.0) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  if (!visible) return null;

  // Function to dismiss keyboard
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          tw`flex-1 bg-black/50`,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <Animated.View 
            style={[
              tw`flex-1 bg-white rounded-t-3xl`,
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            <SafeAreaView style={tw`flex-1`}>
            {/* Header with close button */}
            <View style={tw`flex-row justify-between items-center px-6 pt-4`}>
              <TouchableOpacity onPress={onClose}>
                <AntDesign name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
              <Text style={tw`text-lg font-bold text-gray-700`}>Rate this place</Text>
              <View style={tw`w-7`} />
            </View>

            {/* Pizza place name */}
            <Text style={tw`text-2xl font-bold text-center mt-4 text-red-600 px-6`}>
              {placeName}
            </Text>

            {/* Rating selector */}
            <View style={tw`items-center justify-center mt-8 px-6`}>
              <Text style={tw`text-base text-gray-600 mb-4`}>How would you rate your experience?</Text>
              
              <View style={tw`flex-row items-center justify-center`}>
                <TouchableOpacity 
                  onPress={decrementRating}
                  style={tw`bg-gray-200 w-12 h-12 rounded-full items-center justify-center`}
                >
                  <AntDesign name="minus" size={24} color="#4b5563" />
                </TouchableOpacity>
                
                <View style={tw`mx-6 items-center`}>
                  <Text style={[
                    tw`text-7xl font-bold`,
                    { color: getRatingColor() }
                  ]}>
                    {rating.toFixed(1)}
                  </Text>
                  <Text style={tw`text-gray-500 mt-1`}>out of 10.0</Text>
                </View>
                
                <TouchableOpacity 
                  onPress={incrementRating}
                  style={tw`bg-gray-200 w-12 h-12 rounded-full items-center justify-center`}
                >
                  <AntDesign name="plus" size={24} color="#4b5563" />
                </TouchableOpacity>
              </View>

              {/* Rating description */}
              <Text style={[tw`text-lg font-medium mt-4 text-center`, rating >= 8.0 ? tw`text-green-600` : rating >= 6.0 ? tw`text-yellow-500` : rating >= 4.0 ? tw`text-orange-500` : tw`text-red-500`]}>
                {rating >= 9.0 ? 'Outstanding!' : 
                 rating >= 8.0 ? 'Excellent' :
                 rating >= 7.0 ? 'Very Good' :
                 rating >= 6.0 ? 'Good' :
                 rating >= 5.0 ? 'Average' :
                 rating >= 4.0 ? 'Needs Improvement' :
                 rating >= 3.0 ? 'Poor' :
                 rating >= 2.0 ? 'Very Poor' :
                 'Terrible'}
              </Text>
            </View>

            {/* Comment section */}
            <View style={tw`px-6 mt-8 flex-1`}>
              <Text style={tw`text-base font-medium text-gray-700 mb-2`}>Share your thoughts (optional)</Text>
              <TextInput
                style={tw`bg-gray-100 rounded-xl p-4 text-base min-h-[120px] text-gray-800`}
                placeholder="What did you like or dislike about this place?"
                multiline
                textAlignVertical="top"
                value={comment}
                onChangeText={setComment}
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={dismissKeyboard}
              />
              <Text style={tw`text-xs text-gray-500 mt-1 text-right mr-2`}>Tap outside to dismiss keyboard</Text>
            </View>

            {/* Submit button */}
            <View style={tw`px-6 mb-8 mt-4`}>
              <TouchableOpacity
                style={tw`bg-red-600 py-4 rounded-xl items-center justify-center`}
                onPress={handleSubmit}
              >
                <Text style={tw`text-white font-bold text-lg`}>Submit Review</Text>
              </TouchableOpacity>
            </View>

              {/* Keyboard dismiss button when keyboard is visible */}
              {isKeyboardVisible && (
                <TouchableOpacity
                  style={tw`absolute top-4 right-4 bg-gray-200 p-3 rounded-full z-10`}
                  onPress={dismissKeyboard}
                >
                  <AntDesign name="close" size={20} color="#4b5563" />
                </TouchableOpacity>
              )}
            </SafeAreaView>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </Modal>
  );
};

export default ReviewSheet;
