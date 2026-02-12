import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
  useAnimatedGestureHandler,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { PanGestureHandler, TapGestureHandler, State } from 'react-native-gesture-handler';
// Removed LinearGradient and BlurView for cleaner design
import * as Haptics from 'expo-haptics';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  backgroundColor?: string;
  borderColor?: string;
  onPress?: () => void;
  enableSwipe?: boolean;
  enableScale?: boolean;
  haptic?: boolean;
  elevation?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  delay = 0,
  backgroundColor = '#FFFFFF',
  borderColor,
  onPress,
  enableSwipe = false,
  enableScale = true,
  haptic = true,
  elevation = 'sm',
}) => {
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const rotateZ = useSharedValue(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withSpring(0, {
        damping: 15,
        stiffness: 100,
      })
    );
    opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
    scale.value = withDelay(
      delay,
      withSpring(1, {
        damping: 12,
        stiffness: 100,
      })
    );
  }, []);

  const triggerHaptic = () => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const tapHandler = useAnimatedGestureHandler({
    onStart: () => {
      if (enableScale) {
        scale.value = withSpring(0.95);
      }
      runOnJS(triggerHaptic)();
    },
    onEnd: () => {
      scale.value = withSpring(1);
      if (onPress) {
        runOnJS(onPress)();
      }
    },
  });

  const panHandler = useAnimatedGestureHandler({
    onStart: () => {
      runOnJS(triggerHaptic)();
    },
    onActive: (event) => {
      if (enableSwipe) {
        translateX.value = event.translationX;
        rotateZ.value = interpolate(
          event.translationX,
          [-200, 0, 200],
          [-15, 0, 15],
          Extrapolate.CLAMP
        );
        opacity.value = interpolate(
          Math.abs(event.translationX),
          [0, 150],
          [1, 0.5],
          Extrapolate.CLAMP
        );
      }
    },
    onEnd: () => {
      translateX.value = withSpring(0);
      rotateZ.value = withSpring(0);
      opacity.value = withTiming(1);
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
      { rotateZ: `${rotateZ.value}deg` },
    ],
    opacity: opacity.value,
  }));

  // Get elevation styles
  const getElevationStyle = () => {
    const elevations = {
      none: { shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
      xs: { shadowOpacity: 0.02, shadowRadius: 1, elevation: 1 },
      sm: { shadowOpacity: 0.03, shadowRadius: 2, elevation: 2 },
      md: { shadowOpacity: 0.04, shadowRadius: 4, elevation: 3 },
      lg: { shadowOpacity: 0.06, shadowRadius: 6, elevation: 4 },
    };
    return elevations[elevation];
  };

  const content = (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor: borderColor || 'transparent',
          borderWidth: borderColor ? 1 : 0,
          ...getElevationStyle(),
        },
        style,
        animatedStyle
      ]}
    >
      {children}
    </Animated.View>
  );

  if (enableSwipe) {
    return <PanGestureHandler onGestureEvent={panHandler}>{content}</PanGestureHandler>;
  }

  if (onPress) {
    return <TapGestureHandler onGestureEvent={tapHandler}>{content}</TapGestureHandler>;
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    // Shadow properties are now controlled by elevation prop
  },
});