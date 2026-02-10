/**
 * ZEROCUE ANIMATION SYSTEM
 * 60fps spring-based animations for top 1% feel
 * Inspired by: Linear, Spotify, Arc Browser
 */

import { withSpring, withTiming, Easing } from 'react-native-reanimated';

// ============================================
// SPRING CONFIGURATIONS
// ============================================

/**
 * Bouncy spring - for playful interactions (buttons, cards)
 * Like: Tinder swipe, Instagram likes
 */
export const SPRING_BOUNCY = {
  damping: 15,
  stiffness: 200,
  mass: 0.8,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 2,
};

/**
 * Smooth spring - for elegant transitions (modals, drawers)
 * Like: Notion sheets, Linear panels
 */
export const SPRING_SMOOTH = {
  damping: 20,
  stiffness: 120,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 2,
};

/**
 * Quick spring - for immediate feedback (haptic companion)
 * Like: iOS keyboard, Arc browser tabs
 */
export const SPRING_QUICK = {
  damping: 25,
  stiffness: 300,
  mass: 0.5,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 2,
};

/**
 * Gentle spring - for ambient animations (floating elements)
 * Like: Apple Music artwork, Spotify player
 */
export const SPRING_GENTLE = {
  damping: 30,
  stiffness: 80,
  mass: 1.2,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 2,
};

// ============================================
// TIMING CONFIGURATIONS
// ============================================

export const TIMING = {
  /** 100ms - Instant feedback (button press, haptic) */
  INSTANT: 100,

  /** 200ms - Quick interactions (micro-animations) */
  QUICK: 200,

  /** 300ms - Standard transitions (screen changes) */
  STANDARD: 300,

  /** 500ms - Smooth animations (page transitions) */
  SMOOTH: 500,

  /** 800ms - Dramatic effects (success celebrations) */
  DRAMATIC: 800,
};

// ============================================
// EASING CURVES
// ============================================

/**
 * Ease Out Expo - Best for exits and reveals
 * Like: Notion command palette, Linear search
 */
export const EASE_OUT_EXPO = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * Ease In Out Cubic - Best for smooth transitions
 * Like: iOS animations, Material Design
 */
export const EASE_IN_OUT_CUBIC = Easing.bezier(0.65, 0, 0.35, 1);

/**
 * Ease Out Back - Best for playful bounces
 * Like: Instagram story reactions, Airbnb cards
 */
export const EASE_OUT_BACK = Easing.bezier(0.34, 1.56, 0.64, 1);

// ============================================
// ANIMATION HELPERS
// ============================================

/**
 * Button press animation - Scale down with spring
 * Usage: onPressIn={() => scale.value = withButtonPress()}
 */
export const withButtonPress = () => {
  'worklet';
  return withSpring(0.95, SPRING_QUICK);
};

/**
 * Button release animation - Scale back with overshoot
 * Usage: onPressOut={() => scale.value = withButtonRelease()}
 */
export const withButtonRelease = () => {
  'worklet';
  return withSpring(1, SPRING_BOUNCY);
};

/**
 * Fade in animation - For appearing elements
 */
export const withFadeIn = (duration: number = TIMING.STANDARD) => {
  'worklet';
  return withTiming(1, { duration, easing: EASE_OUT_EXPO });
};

/**
 * Fade out animation - For disappearing elements
 */
export const withFadeOut = (duration: number = TIMING.QUICK) => {
  'worklet';
  return withTiming(0, { duration, easing: EASE_IN_OUT_CUBIC });
};

/**
 * Slide up animation - For bottom sheets, modals
 */
export const withSlideUp = (toValue: number = 0) => {
  'worklet';
  return withSpring(toValue, SPRING_SMOOTH);
};

/**
 * Slide down animation - For dismissing modals
 */
export const withSlideDown = (fromValue: number) => {
  'worklet';
  return withSpring(fromValue, SPRING_SMOOTH);
};

/**
 * Scale pop animation - For success states, add-to-cart
 * Scales: 0 → 1.2 → 1.0 (with overshoot)
 */
export const withScalePop = () => {
  'worklet';
  return withSpring(1, {
    damping: 10,
    stiffness: 200,
    mass: 0.5,
  });
};

/**
 * Elastic entrance - For dramatic reveals
 * Like: App Store "Get" button, Spotify play button
 */
export const withElasticEntrance = (toValue: number = 1) => {
  'worklet';
  return withSpring(toValue, {
    damping: 12,
    stiffness: 180,
    mass: 0.8,
  });
};

// ============================================
// GESTURE CONFIGURATIONS
// ============================================

/**
 * Swipe velocity threshold (points per second)
 * Higher = requires faster swipe to trigger
 */
export const SWIPE_VELOCITY_THRESHOLD = 500;

/**
 * Swipe distance threshold (points)
 * Minimum distance to consider a swipe gesture
 */
export const SWIPE_DISTANCE_THRESHOLD = 50;

/**
 * Long press duration (ms)
 * Time to hold before long press activates
 */
export const LONG_PRESS_DURATION = 500;

/**
 * Pan gesture activation distance (points)
 * How far to drag before pan gesture activates
 */
export const PAN_ACTIVATION_DISTANCE = 10;
