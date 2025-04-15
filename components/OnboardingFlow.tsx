import React, { useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  Animated, 
  FlatList 
} from 'react-native';
import { Text } from '@/components/CustomText';
import { AntDesign } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import OnboardingSvg from './OnboardingSvg';
import tw from '@/utils/tw';

interface OnboardingFlowProps {
  visible: boolean;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ visible, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const onboardingData = [
    {
      id: '1',
      title: 'Welcome to Pizza Rat',
      description: 'Your ultimate guide to finding the best pizza in Brooklyn and beyond.',
      screenNumber: 1,
    },
    {
      id: '2',
      title: 'Discover Pizza Spots',
      description: 'Explore the map to find pizza places near you, read reviews, and find your next favorite slice.',
      screenNumber: 2,
    },
    {
      id: '3',
      title: 'Rate & Share',
      description: 'Leave your own reviews and share your pizza experiences with the community.',
      screenNumber: 3,
    },
  ];

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
  };

  const renderItem = ({ item }: { item: typeof onboardingData[0] }) => {
    return (
      <View style={[styles.slide, { width }]}>
        <OnboardingSvg 
          screen={item.screenNumber as 1 | 2 | 3} 
          width={width * 0.6}
          height={width * 0.6}
        />
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: index === currentIndex ? '#FF6B6B' : '#D1D5DB' }
            ]}
          />
        ))}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.contentContainer}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleSkip}
        >
          <AntDesign name="close" size={24} color="#6B7280" />
        </TouchableOpacity>

        <FlatList
          ref={flatListRef}
          data={onboardingData}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
          keyExtractor={(item) => item.id}
        />

        {renderDots()}

        <View style={styles.buttonContainer}>
          {currentIndex < onboardingData.length - 1 ? (
            <>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNext}
              >
                <Text style={styles.nextButtonText}>Next</Text>
                <AntDesign name="arrowright" size={20} color="#FFFFFF" style={styles.arrowIcon} />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, styles.getStartedButton]}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>Get Started</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  contentContainer: {
    width: width * 0.9,
    height: height * 0.75,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  image: {
    width: width * 0.6,
    height: width * 0.6,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Zodiak',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Zodiak',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Zodiak',
  },
  nextButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Zodiak',
  },
  arrowIcon: {
    marginLeft: 8,
  },
  getStartedButton: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default OnboardingFlow;
