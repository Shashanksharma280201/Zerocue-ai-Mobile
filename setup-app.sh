#!/bin/bash

# ScanPay Mobile - Complete App Setup Script
# This script generates all remaining screens and components

echo "🚀 Setting up ScanPay Mobile App..."

# Create UI Components
mkdir -p components/ui

# Button Component
cat > components/ui/Button.tsx << 'EOF'
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/Colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
}: ButtonProps) {
  const getButtonStyle = () => {
    const baseStyle = [styles.button];

    // Variant styles
    if (variant === 'primary') baseStyle.push(styles.primaryButton);
    if (variant === 'secondary') baseStyle.push(styles.secondaryButton);
    if (variant === 'outline') baseStyle.push(styles.outlineButton);

    // Size styles
    if (size === 'sm') baseStyle.push(styles.smallButton);
    if (size === 'lg') baseStyle.push(styles.largeButton);

    // State styles
    if (disabled) baseStyle.push(styles.disabledButton);
    if (fullWidth) baseStyle.push(styles.fullWidth);

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText];

    if (variant === 'primary') baseStyle.push(styles.primaryText);
    if (variant === 'secondary') baseStyle.push(styles.secondaryText);
    if (variant === 'outline') baseStyle.push(styles.outlineText);

    if (size === 'sm') baseStyle.push(styles.smallText);
    if (size === 'lg') baseStyle.push(styles.largeText);

    if (disabled) baseStyle.push(styles.disabledText);

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? Colors.primary : Colors.white} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={getTextStyle()}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: Spacing.sm,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  smallButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  largeButton: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  disabledButton: {
    backgroundColor: Colors.borderLight,
    opacity: 0.6,
  },
  fullWidth: {
    width: '100%',
  },
  buttonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  primaryText: {
    color: Colors.white,
  },
  secondaryText: {
    color: Colors.white,
  },
  outlineText: {
    color: Colors.primary,
  },
  smallText: {
    fontSize: FontSize.sm,
  },
  largeText: {
    fontSize: FontSize.lg,
  },
  disabledText: {
    color: Colors.textSecondary,
  },
});
EOF

echo "✅ Created Button component"

# Input Component
cat > components/ui/Input.tsx << 'EOF'
import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/Colors';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1,
}: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, multiline && styles.multiline]}
        placeholder={placeholder}
        placeholderTextColor={Colors.textLight}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  inputError: {
    borderColor: Colors.error,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});
EOF

echo "✅ Created Input component"

# Card Component
cat > components/ui/Card.tsx << 'EOF'
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../constants/Colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export function Card({ children, style, padding = Spacing.md }: CardProps) {
  return (
    <View style={[styles.card, { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});
EOF

echo "✅ Created Card component"

# ProductCard Component
cat > components/ui/ProductCard.tsx << 'EOF'
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Product } from '../../lib/types';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/Colors';
import { Card } from './Card';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToCart?: () => void;
}

export function ProductCard({ product, onPress, onAddToCart }: ProductCardProps) {
  const formattedPrice = `₹${product.mrp.toFixed(2)}`;
  const hasImage = product.media && product.media.length > 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card} padding={0}>
        {hasImage ? (
          <Image
            source={{ uri: product.media![0] }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
          {product.category && (
            <Text style={styles.category}>{product.category}</Text>
          )}
          <View style={styles.footer}>
            <Text style={styles.price}>{formattedPrice}</Text>
            {onAddToCart && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onAddToCart();
                }}
                style={styles.addButton}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  image: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  placeholder: {
    width: '100%',
    height: 150,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  placeholderText: {
    color: Colors.textLight,
    fontSize: FontSize.sm,
  },
  content: {
    padding: Spacing.md,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  category: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
EOF

echo "✅ Created ProductCard component"

echo ""
echo "✅ All UI components created successfully!"
echo ""
echo "📱 Next steps:"
echo "1. Copy your Supabase credentials to .env file"
echo "2. Run: npm start"
echo "3. Scan QR with Expo Go app"
echo ""
echo "The app structure is ready. I'll create the remaining screens in the next batch."
echo "Run this script with: bash setup-app.sh"
