import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Fashion-forward color palette
const FashionColors = {
  primary: '#6B3AA0',        // Deep Plum
  primaryLight: '#8B5CF6',   // Electric Violet
  primaryDark: '#4C1D95',    // Royal Purple
  secondary: '#E8B4B8',      // Rose Gold
  accent: '#F472B6',         // Hot Pink
  charcoal: '#1F1F23',
  gray: {
    50: '#FAF9F7',
    100: '#F5F3F0',
    200: '#E7E5E2',
    300: '#D4D2CE',
    400: '#A8A5A0',
    500: '#6B6966',
  },
  white: '#FFFFFF',
};

interface QuickScanButtonProps {
  variant?: 'hero' | 'compact' | 'floating' | 'minimal';
  style?: any;
  showPulse?: boolean;
}

export function QuickScanButtonImproved({
  variant = 'hero',
  style,
  showPulse = true
}: QuickScanButtonProps) {
  const router = useRouter();

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showPulse && (variant === 'floating' || variant === 'hero')) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    if (variant === 'hero') {
      // Shimmer effect
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    }

    // Icon rotation on hover effect
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();
  }, [variant, showPulse]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Quick scale animation before navigation
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push('/quick-scan-improved');
    });
  };

  // Hero variant - Large prominent button for main screens
  if (variant === 'hero') {
    return (
      <Animated.View
        style={[
          styles.heroContainer,
          style,
          { transform: [{ scale: pulseAnim }] }
        ]}
      >
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[FashionColors.primary, FashionColors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            {/* Shimmer overlay */}
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [
                    {
                      translateX: shimmerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-200, 200],
                      }),
                    },
                  ],
                },
              ]}
            />

            <View style={styles.heroContent}>
              {/* Icon with animation */}
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                }}
              >
                <View style={styles.heroIconContainer}>
                  <Ionicons name="scan" size={32} color={FashionColors.white} />
                  <View style={styles.heroIconBadge}>
                    <Ionicons name="sparkles" size={12} color={FashionColors.primary} />
                  </View>
                </View>
              </Animated.View>

              {/* Text content */}
              <View style={styles.heroTextContainer}>
                <Text style={styles.heroTitle}>AI Style Scanner</Text>
                <Text style={styles.heroSubtitle}>Get instant fashion insights</Text>
              </View>

              {/* Arrow indicator */}
              <Ionicons name="arrow-forward" size={24} color={FashionColors.white} />
            </View>

            {/* Badge */}
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>NEW</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Floating variant - FAB style button
  if (variant === 'floating') {
    return (
      <Animated.View
        style={[
          styles.floatingContainer,
          style,
          { transform: [{ scale: pulseAnim }] }
        ]}
      >
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[FashionColors.secondary, FashionColors.accent]}
            style={styles.floatingGradient}
          >
            <Ionicons name="scan" size={28} color={FashionColors.white} />

            {/* Pulse rings */}
            {showPulse && (
              <>
                <Animated.View
                  style={[
                    styles.pulseRing,
                    {
                      transform: [{ scale: pulseAnim }],
                      opacity: pulseAnim.interpolate({
                        inputRange: [1, 1.05],
                        outputRange: [0.3, 0],
                      }),
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.pulseRing,
                    styles.pulseRingLarge,
                    {
                      transform: [{ scale: pulseAnim }],
                      opacity: pulseAnim.interpolate({
                        inputRange: [1, 1.05],
                        outputRange: [0.2, 0],
                      }),
                    },
                  ]}
                />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Compact variant - Small inline button
  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={[styles.compactButton, style]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[FashionColors.primary + '15', FashionColors.secondary + '15']}
          style={styles.compactGradient}
        >
          <Ionicons name="scan-circle" size={20} color={FashionColors.primary} />
          <Text style={styles.compactText}>Quick Scan</Text>
          <View style={styles.compactBadge}>
            <Text style={styles.compactBadgeText}>AI</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Minimal variant - Icon only button
  return (
    <TouchableOpacity
      style={[styles.minimalButton, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <BlurView intensity={20} style={styles.minimalBlur}>
        <Ionicons name="scan" size={24} color={FashionColors.primary} />
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Hero Variant
  heroContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: FashionColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  heroGradient: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: FashionColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: FashionColors.white,
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  heroBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: FashionColors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: FashionColors.white,
    letterSpacing: 0.5,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ skewX: '-20deg' }],
  },

  // Floating Variant
  floatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 80,
    right: 20,
    borderRadius: 32,
    overflow: 'visible',
  },
  floatingGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: FashionColors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  pulseRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: FashionColors.accent,
  },
  pulseRingLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    left: -8,
    top: -8,
  },

  // Compact Variant
  compactButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  compactGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: FashionColors.primary + '30',
    borderRadius: 25,
  },
  compactText: {
    fontSize: 14,
    fontWeight: '600',
    color: FashionColors.primary,
  },
  compactBadge: {
    backgroundColor: FashionColors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  compactBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: FashionColors.white,
  },

  // Minimal Variant
  minimalButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  minimalBlur: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(107, 58, 160, 0.1)',
    borderWidth: 1,
    borderColor: FashionColors.primary + '30',
    borderRadius: 22,
  },
});