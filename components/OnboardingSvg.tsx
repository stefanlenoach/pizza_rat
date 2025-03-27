import React from 'react';
import { SvgXml } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';

// SVG content for each onboarding screen
const svgContent = {
  screen1: `
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="80" fill="#FF6B6B" opacity="0.2"/>
      <circle cx="100" cy="100" r="60" fill="#FF6B6B" opacity="0.4"/>
      <path d="M100 50C83.4315 50 70 63.4315 70 80C70 96.5685 83.4315 110 100 110C116.569 110 130 96.5685 130 80C130 63.4315 116.569 50 100 50ZM100 110C83.4315 110 70 123.431 70 140H130C130 123.431 116.569 110 100 110Z" fill="#FF6B6B"/>
      <path d="M140 90C140 90 150 100 150 110C150 120 140 130 140 130" stroke="#FF6B6B" stroke-width="5" stroke-linecap="round"/>
      <path d="M60 90C60 90 50 100 50 110C50 120 60 130 60 130" stroke="#FF6B6B" stroke-width="5" stroke-linecap="round"/>
    </svg>
  `,
  screen2: `
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="80" fill="#FF6B6B" opacity="0.2"/>
      <rect x="50" y="60" width="100" height="80" rx="8" fill="#FF6B6B" opacity="0.4"/>
      <path d="M60 70L100 90L140 70" stroke="#FF6B6B" stroke-width="4" stroke-linecap="round"/>
      <circle cx="80" cy="110" r="10" fill="#FF6B6B"/>
      <circle cx="120" cy="110" r="10" fill="#FF6B6B"/>
      <path d="M90 130C90 130 95 140 100 140C105 140 110 130 110 130" stroke="#FF6B6B" stroke-width="4" stroke-linecap="round"/>
    </svg>
  `,
  screen3: `
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="80" fill="#FF6B6B" opacity="0.2"/>
      <path d="M70 120L100 60L130 120H70Z" fill="#FF6B6B" opacity="0.4"/>
      <path d="M90 100L70 140H130L110 100" stroke="#FF6B6B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="100" cy="80" r="15" fill="#FF6B6B"/>
      <path d="M85 120L90 110M115 120L110 110" stroke="#FF6B6B" stroke-width="3" stroke-linecap="round"/>
      <path d="M90 130H110" stroke="#FF6B6B" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `
};

interface OnboardingSvgProps {
  screen: 1 | 2 | 3;
  width?: number;
  height?: number;
}

const OnboardingSvg: React.FC<OnboardingSvgProps> = ({ 
  screen, 
  width = 200, 
  height = 200 
}) => {
  // Select the appropriate SVG content based on the screen number
  const xml = svgContent[`screen${screen}`];

  return (
    <View style={styles.container}>
      <SvgXml xml={xml} width={width} height={height} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OnboardingSvg;
