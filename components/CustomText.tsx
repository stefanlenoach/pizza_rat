import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import tw from '@/utils/tw';

/**
 * CustomText component that ensures Zodiak font is applied to all text
 * This component should be used instead of the standard React Native Text component
 */
export const Text: React.FC<TextProps> = ({ style, children, ...props }) => {
  return (
    <RNText style={[styles.text, style]} {...props}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Zodiak',
    fontWeight: 500,
  },
});

// Export a set of pre-styled text components for common use cases
export const Heading = (props: TextProps) => (
  <Text {...props} style={[tw`text-2xl font-bold`, props.style]}>
    {props.children}
  </Text>
);

export const Subheading = (props: TextProps) => (
  <Text {...props} style={[tw`text-xl font-semibold`, props.style]}>
    {props.children}
  </Text>
);

export const Paragraph = (props: TextProps) => (
  <Text {...props} style={[tw`text-base`, props.style]}>
    {props.children}
  </Text>
);

export const Caption = (props: TextProps) => (
  <Text {...props} style={[tw`text-sm text-gray-600`, props.style]}>
    {props.children}
  </Text>
);

export const Label = (props: TextProps) => (
  <Text {...props} style={[tw`text-xs font-medium`, props.style]}>
    {props.children}
  </Text>
);
