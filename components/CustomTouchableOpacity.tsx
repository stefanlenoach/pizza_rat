import React from 'react';
import { TouchableOpacity as RNTouchableOpacity, TouchableOpacityProps } from 'react-native';
import * as Haptics from 'expo-haptics';

// Define the props interface extending TouchableOpacityProps
interface CustomTouchableOpacityProps extends TouchableOpacityProps {
  children: React.ReactNode;
  onPress: () => void;
  hapticStyle?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
}

export const TouchableOpacity: React.FC<CustomTouchableOpacityProps> = ({
  children,
  onPress,
  hapticStyle = 'medium',
  ...rest
}) => {
  // Function to trigger haptic feedback based on the selected style
  const triggerHaptic = async () => {
    try {
      switch (hapticStyle) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } catch (error) {
      console.warn('Haptics not supported on this device', error);
    }
  };

  // Handle button press with haptic feedback
  const handlePress = () => {
    // triggerHaptic();
    onPress();
  };

  return (
    <RNTouchableOpacity onPress={handlePress} {...rest}>
      {children}
    </RNTouchableOpacity>
  );
};