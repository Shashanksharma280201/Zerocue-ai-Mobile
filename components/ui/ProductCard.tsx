import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { Product } from '../../lib/types';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const GRID_CARD_WIDTH = (screenWidth - Spacing.lg * 2 - Spacing.md) / 2;

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToCart?: () => void;
  variant?: 'grid' | 'horizontal' | 'featured';
}

export function ProductCard({ product, onPress, onAddToCart, variant = 'grid' }: ProductCardProps) {
  const formattedPrice = `₹${product.mrp.toFixed(2)}`;
  const imageUrl = product.media?.[0] || product.image;
  const hasImage = !!imageUrl;

  if (variant === 'horizontal') {
    return <HorizontalProductCard product={product} onPress={onPress} onAddToCart={onAddToCart} />;
  }

  if (variant === 'featured') {
    return <FeaturedProductCard product={product} onPress={onPress} onAddToCart={onAddToCart} />;
  }

  // Grid variant (default) - Modern borderless design
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.gridCard}>
      <View style={styles.gridImageContainer}>
        {hasImage ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.gridImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.gridPlaceholder}>
            <Ionicons name="shirt-outline" size={40} color={Colors.textLight} />
          </View>
        )}
      </View>
      <View style={styles.gridContent}>
        <Text style={styles.gridName} numberOfLines={2}>{product.name}</Text>
        {product.category && (
          <Text style={styles.gridCategory}>{product.category}</Text>
        )}
        <View style={styles.gridFooter}>
          <Text style={styles.gridPrice}>{formattedPrice}</Text>
          {onAddToCart && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
              style={styles.gridAddButton}
            >
              <Ionicons name="add" size={20} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function HorizontalProductCard({ product, onPress, onAddToCart }: ProductCardProps) {
  const formattedPrice = `₹${product.mrp.toFixed(2)}`;
  const imageUrl = product.media?.[0] || product.image;
  const hasImage = !!imageUrl;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.horizontalCard}>
        <View style={styles.horizontalImageContainer}>
          {hasImage ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.horizontalImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.horizontalPlaceholder}>
              <Ionicons name="shirt-outline" size={48} color={Colors.textLight} />
            </View>
          )}
        </View>
        <View style={styles.horizontalContent}>
          <View>
            <Text style={styles.horizontalName} numberOfLines={2}>{product.name}</Text>
            {product.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{product.category}</Text>
              </View>
            )}
          </View>
          <View style={styles.horizontalFooter}>
            <Text style={styles.horizontalPrice}>{formattedPrice}</Text>
            {onAddToCart && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onAddToCart();
                }}
                style={styles.horizontalAddButton}
              >
                <Ionicons name="add" size={18} color={Colors.white} />
                <Text style={styles.horizontalAddButtonText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function FeaturedProductCard({ product, onPress, onAddToCart }: ProductCardProps) {
  const formattedPrice = `₹${product.mrp.toFixed(2)}`;
  const imageUrl = product.media?.[0] || product.image;
  const hasImage = !!imageUrl;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.featuredCard}>
        <View style={styles.featuredImageContainer}>
          {hasImage ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.featuredPlaceholder}>
              <Ionicons name="shirt-outline" size={64} color={Colors.textLight} />
            </View>
          )}
        </View>
        <View style={styles.featuredContent}>
          {product.category && (
            <View style={styles.featuredCategoryBadge}>
              <Text style={styles.featuredCategoryText}>{product.category}</Text>
            </View>
          )}
          <Text style={styles.featuredName} numberOfLines={2}>{product.name}</Text>
          {product.description && (
            <Text style={styles.featuredDescription} numberOfLines={2}>
              {product.description}
            </Text>
          )}
          <View style={styles.featuredFooter}>
            <Text style={styles.featuredPrice}>{formattedPrice}</Text>
            {onAddToCart && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onAddToCart();
                }}
                style={styles.featuredAddButton}
              >
                <Ionicons name="add" size={20} color={Colors.white} />
                <Text style={styles.featuredAddButtonText}>Add to Cart</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Grid Variant (Default) - Modern Borderless Design
  gridCard: {
    marginBottom: Spacing.lg,
    width: GRID_CARD_WIDTH,
  },
  gridImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.cream[100],
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.cream[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContent: {
    paddingHorizontal: Spacing.xs,
  },
  gridName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  gridCategory: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  gridPrice: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  gridAddButton: {
    backgroundColor: Colors.accent.sage,
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },

  // Horizontal Variant - Clean Design
  horizontalCard: {
    width: 320,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    flexDirection: 'row',
    ...Shadows.small,
  },
  horizontalImageContainer: {
    width: 130,
    height: 160,
    backgroundColor: Colors.cream[100],
  },
  horizontalImage: {
    width: '100%',
    height: '100%',
  },
  horizontalPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.cream[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  horizontalName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  categoryBadge: {
    backgroundColor: Colors.cream[200],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: FontSize.xs - 1,
    color: Colors.text,
    fontWeight: FontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  horizontalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  horizontalPrice: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  horizontalAddButton: {
    backgroundColor: Colors.accent.sage,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...Shadows.small,
  },
  horizontalAddButtonText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

  // Featured Variant - Premium Design
  featuredCard: {
    marginBottom: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    ...Shadows.large,
  },
  featuredImageContainer: {
    width: '100%',
    height: 280,
    backgroundColor: Colors.cream[100],
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.cream[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredContent: {
    padding: Spacing.lg,
  },
  featuredCategoryBadge: {
    backgroundColor: Colors.cream[200],
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  featuredCategoryText: {
    fontSize: FontSize.xs,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featuredName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    lineHeight: 30,
  },
  featuredDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredPrice: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  featuredAddButton: {
    backgroundColor: Colors.accent.sage,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...Shadows.medium,
  },
  featuredAddButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
