import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

interface StyledTextProps extends TextProps {
  children: React.ReactNode;
}

/**
 * A custom Text component that applies the Montagu Slab font by default
 * to ensure consistent font usage throughout the app.
 */
export function StyledText({ style, children, ...otherProps }: StyledTextProps) {
  return (
    <Text style={[styles.defaultText, style]} {...otherProps}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  defaultText: {
    fontFamily: 'ClashDisplay',
  },
});
