import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface MinimalButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
  fullWidth?: boolean;
}

export const MinimalButton: React.FC<MinimalButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  haptic = true,
  fullWidth = false,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.button,
      ...(fullWidth && styles.fullWidth),
      ...getSizeStyle(),
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? Colors.light.neutral[300] : Colors.light.primary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? Colors.light.neutral[300] : Colors.light.accent,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: disabled ? Colors.light.neutral[300] : Colors.light.primary,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: disabled ? Colors.light.neutral[300] : Colors.light.error,
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...styles.text,
      ...getSizeTextStyle(),
    };

    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return {
          ...baseStyle,
          color: Colors.light.text.inverse,
        };
      case 'outline':
        return {
          ...baseStyle,
          color: disabled ? Colors.light.neutral[400] : Colors.light.primary,
        };
      case 'ghost':
        return {
          ...baseStyle,
          color: disabled ? Colors.light.neutral[400] : Colors.light.text.primary,
        };
      default:
        return baseStyle;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.xs + 2,
          minHeight: 36,
        };
      case 'lg':
        return {
          paddingHorizontal: Spacing.xl,
          paddingVertical: Spacing.md,
          minHeight: 56,
        };
      default: // md
        return {
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.sm + 2,
          minHeight: 44,
        };
    }
  };

  const getSizeTextStyle = (): TextStyle => {
    switch (size) {
      case 'sm':
        return {
          fontSize: 14,
          fontWeight: '600',
        };
      case 'lg':
        return {
          fontSize: 18,
          fontWeight: '600',
        };
      default: // md
        return {
          fontSize: 16,
          fontWeight: '600',
        };
    }
  };

  return (
    <AnimatedTouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[getButtonStyle(), animatedStyle, style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost'
            ? Colors.light.primary
            : Colors.light.text.inverse}
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: Spacing.xs,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});