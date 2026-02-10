import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '../constants/Colors';
import { ProductCard } from '../components/ui/ProductCard';
import { Button } from '../components/ui/Button';
import { useWishlistStore } from '../lib/stores/wishlistStore';
import { useCartStore } from '../lib/stores/cartStore';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 2;

export default function WishlistScreen() {
  const router = useRouter();
  const { items, removeFromWishlist, clearWishlist, getItemCount } = useWishlistStore();
  const { addItem } = useCartStore();

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const handleAddToCart = (product: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addItem(product, 1);
    Alert.alert('Added to Cart', `${product.name} added to your cart`);
  };

  const handleRemoveFromWishlist = (productId: string, productName: string) => {
    Alert.alert(
      'Remove from Wishlist',
      `Remove ${productName} from your wishlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            removeFromWishlist(productId);
          },
        },
      ]
    );
  };

  const handleClearWishlist = () => {
    Alert.alert(
      'Clear Wishlist',
      'Are you sure you want to remove all items from your wishlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            clearWishlist();
          },
        },
      ]
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={80} color={Colors.textLight} />
      <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
      <Text style={styles.emptyText}>
        Save your favorite products here to easily find them later
      </Text>
      <Button
        title="Start Shopping"
        onPress={() => router.push('/(tabs)/home')}
        style={styles.emptyButton}
      />
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.itemCount}>
        {getItemCount()} {getItemCount() === 1 ? 'Item' : 'Items'}
      </Text>
      {getItemCount() > 0 && (
        <TouchableOpacity onPress={handleClearWishlist}>
          <Text style={styles.clearButton}>Clear All</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderProduct = ({ item }: { item: any }) => (
    <View style={styles.productContainer}>
      {/* Heart icon overlay */}
      <TouchableOpacity
        style={styles.heartButton}
        onPress={() => handleRemoveFromWishlist(item.id, item.name)}
      >
        <View style={styles.heartIconContainer}>
          <Ionicons name="heart" size={20} color={Colors.error} />
        </View>
      </TouchableOpacity>

      <ProductCard
        product={item}
        onPress={() => handleProductPress(item.id)}
        onAddToCart={() => handleAddToCart(item)}
        variant="grid"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Wishlist',
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTitleStyle: {
            fontSize: FontSize.xl,
            fontWeight: FontWeight.bold,
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerBackButton}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      {items.length === 0 ? (
        renderEmpty()
      ) : (
        <FlatList
          data={items}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          ListHeaderComponent={renderHeader}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  itemCount: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  clearButton: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.error,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  row: {
    justifyContent: 'space-between',
  },
  productContainer: {
    position: 'relative',
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    marginBottom: Spacing.md,
  },
  heartButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    zIndex: 10,
  },
  heartIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  emptyButton: {
    minWidth: 200,
  },
});
