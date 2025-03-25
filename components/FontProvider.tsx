import React from 'react';
import { StyleSheet, Platform } from 'react-native';

/**
 * FontProvider component that wraps the entire application.
 * 
 * This component ensures that the ClashDisplay font is applied globally.
 * The actual font application is done through:
 * 1. Tailwind configuration (tailwind.config.js)
 * 2. Global CSS (global.css)
 * 3. Custom Text components (CustomText.tsx)
 */
export function FontProvider({ children }: { children: React.ReactNode }) {
  // On iOS and Android, we need to ensure the font is loaded before rendering
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return <>{children}</>;
  }
  
  // On web, we can just render the children
  return <>{children}</>;
}

// Export styles for use throughout the app
export const fontStyles = StyleSheet.create({
  defaultText: {
    fontFamily: 'ClashDisplay',
  },
});
