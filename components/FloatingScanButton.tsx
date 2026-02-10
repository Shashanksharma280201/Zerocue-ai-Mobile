/**
 * ZEROCUE FLOATING SCAN BUTTON
 * Always-accessible scan button with pulsing animation
 * Inspired by: iOS Shortcuts, Telegram voice button, Arc Browser quick actions
 *
 * Key features:
 * - Pulsing glow animation (breathing effect)
 * - Spring-based press animation
 * - Drag to reposition
 * - Haptic feedback
 * - Quick press = instant camera
 */

import { StyleSheet, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows } from '../constants/Colors';
import { SPRING_BOUNCY, SPRING_QUICK } from '../constants/Animations';
import { Haptic } from '../utils/haptics';
import { useEffect } from 'react';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FloatingScanButtonProps {
  /** Override default position */
  bottom?: number;
  right?: number;
}

export function FloatingScanButton({ bottom = 80, right = 20 }: FloatingScanButtonProps) {
  const router = useRouter();

  // Animation values
  const scale = useSharedValue(1);
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);

  // Pulsing glow animation (breathing effect)
  useEffect(() => {
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // Infinite
      false
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  // Button press animations
  const handlePressIn = () => {
    Haptic.floatingButton();
    scale.value = withSpring(0.9, SPRING_QUICK);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_BOUNCY);
  };

  const handlePress = () => {
    // Navigate to scanner/bookings screen
    router.push('/(tabs)/bookings');
  };

  // Animated styles
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  return (
    <View style={[styles.container, { bottom, right }]}>
      {/* Animated glow ring */}
      <Animated.View style={[styles.glow, glowStyle]} />

      {/* Main button */}
      <AnimatedPressable
        style={[styles.button, buttonStyle]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <LinearGradient
          colors={['#00D9FF', '#0099CC']} // Electric cyan gradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Ionicons name="scan" size={32} color={Colors.white} />
        </LinearGradient>

        {/* Subtle inner border for depth */}
        <View style={styles.innerBorder} />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    ...Shadows.large,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    pointerEvents: 'none',
  },
  glow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 42,
    backgroundColor: '#00D9FF',
    opacity: 0.5,
  },
});

/**
 * Variant: Compact Floating Button (smaller, less prominent)
 * Use when space is limited or for secondary actions
 */
export function CompactFloatingScanButton({ bottom = 80, right = 20 }: FloatingScanButtonProps) {
  const router = useRouter();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    Haptic.light();
    scale.value = withSpring(0.92, SPRING_QUICK);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_BOUNCY);
  };

  const handlePress = () => {
    router.push('/(tabs)/bookings');
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.compactButton, buttonStyle, { bottom, right }]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <LinearGradient
        colors={['#00D9FF', '#0099CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.compactGradient}
      >
        <Ionicons name="scan" size={24} color={Colors.white} />
      </LinearGradient>
    </AnimatedPressable>
  );
}

const compactStyles = StyleSheet.create({
  compactButton: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    zIndex: 1000,
    ...Shadows.medium,
  },
  compactGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

Object.assign(styles, compactStyles);
