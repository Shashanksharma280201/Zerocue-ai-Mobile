import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, {
  FadeIn,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/Colors';

interface MinimalCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  elevation?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  animated?: boolean;
  haptic?: boolean;
}

export const MinimalCard: React.FC<MinimalCardProps> = ({
  children,
  style,
  padding = 'md',
  onPress,
  backgroundColor = Colors.light.surface,
  borderColor,
  borderWidth = 0,
  elevation = 'xs',
  animated = true,
  haptic = true,
}) => {
  const getPaddingStyle = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'sm':
        return { padding: Spacing.sm };
      case 'lg':
        return { padding: Spacing.lg };
      default: // md
        return { padding: Spacing.md };
    }
  };

  const getElevationStyle = (): ViewStyle => {
    return Shadows[elevation] || Shadows.xs;
  };

  const cardStyle: ViewStyle = {
    ...styles.card,
    backgroundColor,
    borderColor: borderColor || Colors.light.neutral[200],
    borderWidth: borderWidth,
    ...getPaddingStyle(),
    ...getElevationStyle(),
  };

  const handlePress = () => {
    if (onPress) {
      if (haptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress();
    }
  };

  const content = <View style={[cardStyle, style]}>{children}</View>;

  if (onPress) {
    const touchableContent = (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={handlePress}
        style={styles.touchable}
      >
        {content}
      </TouchableOpacity>
    );

    return animated ? (
      <Animated.View entering={FadeIn.duration(300)} layout={Layout.springify()}>
        {touchableContent}
      </Animated.View>
    ) : touchableContent;
  }

  return animated ? (
    <Animated.View entering={FadeIn.duration(300)} layout={Layout.springify()}>
      {content}
    </Animated.View>
  ) : content;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.surface,
    overflow: 'hidden',
  },
  touchable: {
    width: '100%',
  },
});