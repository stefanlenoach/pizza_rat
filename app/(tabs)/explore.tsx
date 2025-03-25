import { StyleSheet, Image, Platform, View, TouchableOpacity, Modal, Dimensions, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import PizzaRatHeader from '@/components/PizzaRatHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import tw from '@/utils/tw';

// Component for the moving red circle
const MovingRedCircle = () => {
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  const circleSize = 50; // 50px diameter
  
  // Animation values
  const xPosition = useSharedValue(-100); // Start off-screen
  const yPosition = useSharedValue(100);
  const opacity = useSharedValue(0); // Start invisible
  
  // State for popup and visibility
  const [showPopup, setShowPopup] = useState(false);
  const [score, setScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  // Timer references
  const appearTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Generate random entry point (from an edge)
  const generateEntryPoint = () => {
    // Decide which edge to start from (0: top, 1: right, 2: bottom, 3: left)
    const edge = Math.floor(Math.random() * 4);
    let startX, startY;
    
    switch (edge) {
      case 0: // Top
        startX = Math.random() * windowWidth;
        startY = -circleSize;
        break;
      case 1: // Right
        startX = windowWidth;
        startY = Math.random() * (windowHeight - 300) + 100;
        break;
      case 2: // Bottom
        startX = Math.random() * windowWidth;
        startY = windowHeight;
        break;
      case 3: // Left
        startX = -circleSize;
        startY = Math.random() * (windowHeight - 300) + 100;
        break;
      default:
        startX = -circleSize;
        startY = 100;
    }
    
    return { x: startX, y: startY };
  };
  
  // Generate random exit point (to an edge)
  const generateExitPoint = () => {
    // Decide which edge to exit to (0: top, 1: right, 2: bottom, 3: left)
    const edge = Math.floor(Math.random() * 4);
    let endX, endY;
    
    switch (edge) {
      case 0: // Top
        endX = Math.random() * windowWidth;
        endY = -circleSize;
        break;
      case 1: // Right
        endX = windowWidth;
        endY = Math.random() * (windowHeight - 300) + 100;
        break;
      case 2: // Bottom
        endX = Math.random() * windowWidth;
        endY = windowHeight;
        break;
      case 3: // Left
        endX = -circleSize;
        endY = Math.random() * (windowHeight - 300) + 100;
        break;
      default:
        endX = windowWidth;
        endY = 100;
    }
    
    return { x: endX, y: endY };
  };
  
  // Generate random position within screen
  const generateRandomPosition = () => {
    return {
      x: Math.random() * (windowWidth - circleSize),
      y: Math.random() * (windowHeight - 300 - circleSize) + 100 // Avoid header area
    };
  };
  
  // Start a new circle cycle
  const startCircleCycle = () => {
    // Generate entry and target points
    const entryPoint = generateEntryPoint();
    const targetPos = generateRandomPosition();
    
    // Set initial position off-screen
    xPosition.value = entryPoint.x;
    yPosition.value = entryPoint.y;
    opacity.value = 1; // Make fully visible immediately
    setIsVisible(true);
    
    // Animate from entry point to target position
    xPosition.value = withTiming(targetPos.x, {
      duration: 500,
      easing: Easing.out(Easing.quad)
    });
    
    yPosition.value = withTiming(targetPos.y, {
      duration: 500,
      easing: Easing.out(Easing.quad)
    });
    
    // After the circle reaches its target position, wait briefly then exit
    setTimeout(() => {
      const exitPoint = generateExitPoint();
      
      // Animate to exit point
      xPosition.value = withTiming(exitPoint.x, {
        duration: 500,
        easing: Easing.out(Easing.quad)
      });
      
      yPosition.value = withTiming(exitPoint.y, {
        duration: 500,
        easing: Easing.out(Easing.quad)
      });
      
      // Fade out as it exits
      opacity.value = withTiming(0, { duration: 300 });
      setIsVisible(false);
      
      // Schedule next appearance after random delay (between 5-15 seconds)
      const nextDelay = 5000 + Math.random() * 10000;
      appearTimerRef.current = setTimeout(startCircleCycle, nextDelay);
    }, 1000);
  };
  
  // Initialize the cycle
  useEffect(() => {
    // Initial delay of 10 seconds before first appearance
    appearTimerRef.current = setTimeout(startCircleCycle, 10000);
    
    // Clean up on unmount
    return () => {
      if (appearTimerRef.current) clearTimeout(appearTimerRef.current);
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
    };
  }, []);
  
  // Handle circle click
  const handleCirclePress = () => {
    if (!isVisible) return; // Prevent clicking when not visible
    
    setScore(prev => prev + 1);
    setShowPopup(true);
    
    // Hide popup after 1.5 seconds
    setTimeout(() => {
      setShowPopup(false);
    }, 1500);
    
    // Make the circle disappear immediately when clicked
    const exitPoint = generateExitPoint();
    xPosition.value = withTiming(exitPoint.x, { duration: 300 });
    yPosition.value = withTiming(exitPoint.y, { duration: 300 });
    opacity.value = withTiming(0, { duration: 200 });
    setIsVisible(false);
    
    // Clear any pending timers
    if (appearTimerRef.current) clearTimeout(appearTimerRef.current);
    
    // Schedule next appearance after random delay (between 5-15 seconds)
    const nextDelay = 5000 + Math.random() * 10000;
    appearTimerRef.current = setTimeout(startCircleCycle, nextDelay);
  };
  
  // Animated style for the circle
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: xPosition.value },
        { translateY: yPosition.value }
      ],
      opacity: opacity.value
    };
  });
  
  return (
    <View style={styles.gameContainer}>
      <Animated.View style={[styles.circleContainer, animatedStyle]}>
        <TouchableOpacity 
          style={styles.circle} 
          onPress={handleCirclePress}
          activeOpacity={0.8}
        />
      </Animated.View>
      
      {/* Score display */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Score: {score}</Text>
      </View>
      
      {/* Popup when circle is clicked */}
      {showPopup && (
        <View style={styles.popup}>
          <Text style={styles.popupText}>Nice catch! +1 point</Text>
        </View>
      )}
    </View>
  );
};

export default function ExploreScreen() {
  return (
    <View style={tw`flex-1`}>
      <StatusBar style="light" />
      <PizzaRatHeader title="Explore" />
      <View style={tw`flex-1 p-4 relative`}>
        <MovingRedCircle />
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Pizza Resources</ThemedText>
        </ThemedView>
      <ThemedText>This app includes example code to help you get started.</ThemedText>
      <Collapsible title="File-based routing">
        <ThemedText>
          This app has two screens:{' '}
          <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> and{' '}
          <ThemedText type="defaultSemiBold">app/(tabs)/explore.tsx</ThemedText>
        </ThemedText>
        <ThemedText>
          The layout file in <ThemedText type="defaultSemiBold">app/(tabs)/_layout.tsx</ThemedText>{' '}
          sets up the tab navigator.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Android, iOS, and web support">
        <ThemedText>
          You can open this project on Android, iOS, and the web. To open the web version, press{' '}
          <ThemedText type="defaultSemiBold">w</ThemedText> in the terminal running this project.
        </ThemedText>
      </Collapsible>
      <Collapsible title="Images">
        <ThemedText>
          For static images, you can use the <ThemedText type="defaultSemiBold">@2x</ThemedText> and{' '}
          <ThemedText type="defaultSemiBold">@3x</ThemedText> suffixes to provide files for
          different screen densities
        </ThemedText>
        <Image source={require('@/assets/images/react-logo.png')} style={{ alignSelf: 'center' }} />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Custom fonts">
        <ThemedText>
          Open <ThemedText type="defaultSemiBold">app/_layout.tsx</ThemedText> to see how to load{' '}
          <ThemedText style={{ fontFamily: 'SpaceMono' }}>
            custom fonts such as this one.
          </ThemedText>
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/versions/latest/sdk/font">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Light and dark mode components">
        <ThemedText>
          This template has light and dark mode support. The{' '}
          <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText> hook lets you inspect
          what the user's current color scheme is, and so you can adjust UI colors accordingly.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Animations">
        <ThemedText>
          This template includes an example of an animated component. The{' '}
          <ThemedText type="defaultSemiBold">components/HelloWave.tsx</ThemedText> component uses
          the powerful <ThemedText type="defaultSemiBold">react-native-reanimated</ThemedText>{' '}
          library to create a waving hand animation.
        </ThemedText>
        {Platform.select({
          ios: (
            <ThemedText>
              The <ThemedText type="defaultSemiBold">components/ParallaxScrollView.tsx</ThemedText>{' '}
              component provides a parallax effect for the header image.
            </ThemedText>
          ),
        })}
      </Collapsible>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  gameContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    pointerEvents: 'box-none',
  },
  circleContainer: {
    position: 'absolute',
    width: 50,
    height: 50,
    zIndex: 100,
  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF0000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  popup: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
    zIndex: 200,
  },
  popupText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 10,
    zIndex: 150,
  },
  scoreText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
