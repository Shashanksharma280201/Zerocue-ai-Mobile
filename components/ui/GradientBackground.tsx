import React from 'react';
import { ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
  colors?: string[];
  locations?: number[];
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  style,
  colors = ['#FFFFFF', '#E3F2FD', '#BBDEFB'], // White to light blue gradient
  locations = [0, 0.5, 1],
}) => {
  return (
    <LinearGradient
      colors={colors}
      locations={locations}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </LinearGradient>
  );
};

// Export a preset for consistent usage across screens
export const ScreenGradient: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({
  children,
  style
}) => (
  <GradientBackground
    colors={['#FFFFFF', '#F0F8FF', '#E6F3FF']} // Subtle white to very light blue
    locations={[0, 0.6, 1]}
    style={style}
  >
    {children}
  </GradientBackground>
);