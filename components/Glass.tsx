/**
 * ZEROCUE GLASSMORPHISM SYSTEM
 * Frosted glass components for premium feel
 * Inspired by: Apple macOS Big Sur, Vision Pro, iOS translucency
 */

import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// import { BlurView } from 'expo-blur'; // Temporarily disabled for troubleshooting
import { Colors, BorderRadius, Shadows } from '../constants/Colors';

// ============================================
// GLASS CARD
// ============================================

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: 'light' | 'medium' | 'strong';
  tint?: 'light' | 'dark' | 'default';
}

/**
 * Glass Card - Frosted glass container
 * Use for: Info cards, overlays, floating panels
 *
 * Example:
 * <GlassCard intensity="medium">
 *   <Text>Content here</Text>
 * </GlassCard>
 */
export function GlassCard({ children, style, intensity = 'medium', tint = 'light' }: GlassCardProps) {
  const opacityValue = {
    light: 0.6,
    medium: 0.7,
    strong: 0.85,
  }[intensity];

  return (
    <View style={[styles.glassCard, style]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(255, 255, 255, ${opacityValue})` }]} />
      <View style={styles.glassCardContent}>
        {children}
      </View>
    </View>
  );
}

// ============================================
// GLASS PANEL
// ============================================

interface GlassPanelProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean;
}

/**
 * Glass Panel - Frosted panel with subtle gradient
 * Use for: Bottom sheets, modals, navigation bars
 *
 * Example:
 * <GlassPanel gradient>
 *   <Text>Bottom sheet content</Text>
 * </GlassPanel>
 */
export function GlassPanel({ children, style, gradient = true }: GlassPanelProps) {
  return (
    <View style={[styles.glassPanel, style]}>
      {gradient ? (
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.6)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.glassPanelFallback]} />
      )}
      <View style={styles.glassBorder} />
      <View style={styles.glassPanelContent}>
        {children}
      </View>
    </View>
  );
}

// ============================================
// GLASS BUTTON
// ============================================

interface GlassButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary';
}

/**
 * Glass Button - Frosted glass button with hover state
 * Use for: Secondary actions, floating buttons
 *
 * Example:
 * <GlassButton onPress={() => {}}>
 *   <Icon name="heart" />
 * </GlassButton>
 */
export function GlassButton({ children, onPress, style, variant = 'secondary' }: GlassButtonProps) {
  return (
    <View style={[styles.glassButton, style]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.8)' }]} />
      <View style={styles.glassBorder} />
      <View style={styles.glassButtonContent}>
        {children}
      </View>
    </View>
  );
}

// ============================================
// GLASS OVERLAY
// ============================================

interface GlassOverlayProps {
  children: React.ReactNode;
  visible: boolean;
  style?: ViewStyle;
}

/**
 * Glass Overlay - Full-screen frosted overlay
 * Use for: Modals, bottom sheets, alerts
 *
 * Example:
 * <GlassOverlay visible={isOpen}>
 *   <Text>Modal content</Text>
 * </GlassOverlay>
 */
export function GlassOverlay({ children, visible, style }: GlassOverlayProps) {
  if (!visible) return null;

  return (
    <View style={[styles.glassOverlay, style]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} />
      {children}
    </View>
  );
}

// ============================================
// GLASS TAB BAR
// ============================================

interface GlassTabBarProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Glass Tab Bar - Frosted bottom navigation
 * Use for: Tab navigation, bottom bars
 *
 * Example:
 * <GlassTabBar>
 *   <TabBarContent />
 * </GlassTabBar>
 */
export function GlassTabBar({ children, style }: GlassTabBarProps) {
  return (
    <View style={[styles.glassTabBar, style]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]} />
      <View style={[styles.glassBorder, styles.glassTabBarBorder]} />
      <View style={styles.glassTabBarContent}>
        {children}
      </View>
    </View>
  );
}

// ============================================
// GLASS HEADER
// ============================================

interface GlassHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Glass Header - Frosted navigation header
 * Use for: Screen headers, navigation bars
 *
 * Example:
 * <GlassHeader>
 *   <HeaderContent />
 * </GlassHeader>
 */
export function GlassHeader({ children, style }: GlassHeaderProps) {
  return (
    <View style={[styles.glassHeader, style]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]} />
      <View style={[styles.glassBorder, styles.glassHeaderBorder]} />
      <View style={styles.glassHeaderContent}>
        {children}
      </View>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  // Glass Card
  glassCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  glassCardContent: {
    padding: 16,
  },

  // Glass Panel
  glassPanel: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.large,
  },
  glassPanelFallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  glassPanelContent: {
    padding: 20,
  },

  // Glass Border (subtle inner glow)
  glassBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    pointerEvents: 'none',
  },

  // Glass Button
  glassButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  glassButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Glass Overlay
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },

  // Glass Tab Bar
  glassTabBar: {
    overflow: 'hidden',
  },
  glassTabBarBorder: {
    borderTopWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderRadius: 0,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  glassTabBarContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },

  // Glass Header
  glassHeader: {
    overflow: 'hidden',
  },
  glassHeaderBorder: {
    borderBottomWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderRadius: 0,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  glassHeaderContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get glassmorphism style object (for custom components)
 *
 * Usage:
 * const glassStyle = getGlassStyle('medium');
 * <View style={[myStyle, glassStyle]}>...</View>
 */
export const getGlassStyle = (intensity: 'light' | 'medium' | 'strong' = 'medium'): ViewStyle => {
  const opacityMap = {
    light: 0.6,
    medium: 0.7,
    strong: 0.85,
  };

  return {
    backgroundColor: `rgba(255, 255, 255, ${opacityMap[intensity]})`,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Shadows.medium,
  };
};

/**
 * Get dark glass style (for dark mode)
 */
export const getDarkGlassStyle = (intensity: 'light' | 'medium' | 'strong' = 'medium'): ViewStyle => {
  const opacityMap = {
    light: 0.3,
    medium: 0.5,
    strong: 0.7,
  };

  return {
    backgroundColor: `rgba(0, 0, 0, ${opacityMap[intensity]})`,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.medium,
  };
};
