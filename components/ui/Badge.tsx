import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/Colors';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function Badge({ label, variant = 'primary', size = 'md', style }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], styles[`size_${size}`], style]}>
      <Text style={[styles.text, styles[`text_${size}`], styles[`text_${variant}`]]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },

  // Variants
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  success: {
    backgroundColor: Colors.success,
  },
  warning: {
    backgroundColor: Colors.warning,
  },
  error: {
    backgroundColor: Colors.error,
  },
  info: {
    backgroundColor: Colors.info,
  },

  // Sizes
  size_sm: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  size_md: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  size_lg: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },

  // Text styles
  text: {
    fontWeight: '600',
    color: Colors.white,
  },
  text_sm: {
    fontSize: 10,
  },
  text_md: {
    fontSize: 12,
  },
  text_lg: {
    fontSize: 14,
  },

  // Text variant colors (for better contrast)
  text_primary: {
    color: Colors.text,
  },
  text_secondary: {
    color: Colors.white,
  },
  text_success: {
    color: Colors.white,
  },
  text_warning: {
    color: Colors.text,
  },
  text_error: {
    color: Colors.white,
  },
  text_info: {
    color: Colors.white,
  },
});
