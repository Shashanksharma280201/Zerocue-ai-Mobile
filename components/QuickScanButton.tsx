import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/Colors';

interface QuickScanButtonProps {
  variant?: 'hero' | 'compact' | 'floating' | 'minimal';
  style?: ViewStyle;
}

export function QuickScanButton({ variant = 'hero', style }: QuickScanButtonProps) {
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (variant === 'floating') {
      // Pulse animation for floating button
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [variant]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/quick-scan');
  };

  // Floating FAB with pulse rings
  if (variant === 'floating') {
    return (
      <View style={[styles.floatingContainer, style]}>
        <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
        <Animated.View
          style={[
            styles.pulseRing,
            styles.pulseRingSecondary,
            { transform: [{ scale: pulseAnim }] },
          ]}
        />
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <View style={styles.floatingOuter}>
            <View style={styles.floatingInner}>
              <Ionicons name="scan" size={28} color={Colors.white} />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // Minimal icon-only with blur
  if (variant === 'minimal') {
    return (
      <TouchableOpacity
        style={[styles.minimalButton, style]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.minimalBlur}>
          <Ionicons name="scan-outline" size={24} color={Colors.fashion.ocean} />
        </View>
      </TouchableOpacity>
    );
  }

  // Compact inline button with AI badge
  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={[styles.compactButton, style]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.compactIcon}>
          <Ionicons name="scan" size={18} color={Colors.fashion.ocean} />
        </View>
        <Text style={styles.compactText}>Quick Scan</Text>
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Hero large button with solid colors - no animation
  return (
    <TouchableOpacity
      style={[styles.heroButton, style]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.heroOuter}>
        <View style={styles.heroInner}>
          <View style={styles.heroContent}>
            <View style={styles.heroIcon}>
              <Ionicons name="scan" size={32} color={Colors.white} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Style Scanner</Text>
              <Text style={styles.heroSubtitle}>Instant fashion recommendations</Text>
            </View>
            <Ionicons name="arrow-forward" size={24} color={Colors.white} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Hero Button Styles - Solid Colors
  heroButton: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    ...Shadows.large,
  },
  heroOuter: {
    backgroundColor: '#E3F2FD',
    padding: 3,
    borderRadius: BorderRadius.xxl,
  },
  heroInner: {
    backgroundColor: Colors.accent.sage,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xxl - 3,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  aiIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.fashion.ocean,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Compact Button Styles - Already Solid Colors
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.cream[50],
    borderRadius: BorderRadius.full,
    ...Shadows.small,
  },
  compactIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${Colors.accent.sage}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent.sage,
    letterSpacing: 0.2,
  },
  aiBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: Colors.accent.sage,
    borderRadius: 8,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },

  // Floating Button Styles - Solid Colors
  floatingContainer: {
    position: 'absolute',
    bottom: 90,
    right: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    ...Shadows.large,
  },
  floatingOuter: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E3F2FD',
    padding: 4,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingInner: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.accent.sage,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.accent.sage,
    opacity: 0.3,
  },
  pulseRingSecondary: {
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.2,
  },

  // Minimal Button Styles - Already Solid Colors
  minimalButton: {
    width: 44,
    height: 44,
  },
  minimalBlur: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    backgroundColor: `${Colors.cream[100]}CC`,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
