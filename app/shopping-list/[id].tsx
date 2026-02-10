import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadows } from '../../constants/Colors';
import { useShoppingListStore } from '../../lib/stores/shoppingListStore';
import { useCartStore } from '../../lib/stores/cartStore';

export default function ShoppingListDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const listId = params.id as string;

  const {
    getList,
    removeItemFromList,
    updateItemQuantity,
    toggleItemChecked,
    clearCheckedItems,
  } = useShoppingListStore();
  const { addItem } = useCartStore();

  const list = getList(listId);
  const [showChecked, setShowChecked] = useState(true);

  if (!list) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'List Not Found' }} />
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
          <Text style={styles.emptyTitle}>List Not Found</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.back()}
          >
            <Text style={styles.emptyButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const uncheckedItems = list.items.filter((item) => !item.checked);
  const checkedItems = list.items.filter((item) => item.checked);
  const displayItems = showChecked ? list.items : uncheckedItems;

  const handleToggleItem = (productId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleItemChecked(listId, productId);
  };

  const handleRemoveItem = (productId: string, productName: string) => {
    Alert.alert(
      'Remove Item',
      `Remove ${productName} from list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            removeItemFromList(listId, productId);
          },
        },
      ]
    );
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    const item = list.items.find((i) => i.productId === productId);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    if (newQuantity < 1) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateItemQuantity(listId, productId, newQuantity);
  };

  const handleClearChecked = () => {
    if (checkedItems.length === 0) return;

    Alert.alert(
      'Clear Checked Items',
      `Remove ${checkedItems.length} checked item(s) from list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            clearCheckedItems(listId);
          },
        },
      ]
    );
  };

  const handleAddAllToCart = () => {
    if (list.items.length === 0) return;

    Alert.alert(
      'Add to Cart',
      `Add all ${uncheckedItems.length} unchecked item(s) to your cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add All',
          onPress: () => {
            uncheckedItems.forEach((item) => {
              addItem(item.product, item.quantity);
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Items added to cart!');
          },
        },
      ]
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cart-outline" size={64} color={Colors.textLight} />
      <Text style={styles.emptyTitle}>List is Empty</Text>
      <Text style={styles.emptyText}>
        Add products to this list from product pages
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push('/(tabs)/home')}
      >
        <Text style={styles.emptyButtonText}>Browse Products</Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemCard}>
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => handleToggleItem(item.productId)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
          {item.checked && <Ionicons name="checkmark" size={18} color={Colors.white} />}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.itemImageContainer}
        onPress={() => router.push(`/product/${item.productId}`)}
        activeOpacity={0.8}
      >
        {item.product.image ? (
          <Image source={{ uri: item.product.image }} style={styles.itemImage} />
        ) : (
          <View style={styles.itemImagePlaceholder}>
            <Ionicons name="image-outline" size={24} color={Colors.textLight} />
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.itemInfo}
        onPress={() => router.push(`/product/${item.productId}`)}
        activeOpacity={0.8}
      >
        <Text style={[styles.itemName, item.checked && styles.itemNameChecked]} numberOfLines={2}>
          {item.product.name}
        </Text>
        <Text style={styles.itemPrice}>₹{item.product.price.toLocaleString()}</Text>
      </TouchableOpacity>

      <View style={styles.itemActions}>
        <View style={styles.quantityControl}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleUpdateQuantity(item.productId, -1)}
            disabled={item.quantity <= 1}
          >
            <Ionicons
              name="remove"
              size={16}
              color={item.quantity <= 1 ? Colors.textLight : Colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleUpdateQuantity(item.productId, 1)}
          >
            <Ionicons name="add" size={16} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item.productId, item.product.name)}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: list.name,
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
              style={styles.headerButton}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      {list.items.length === 0 ? (
        renderEmpty()
      ) : (
        <>
          {/* Header Info */}
          <View style={styles.headerInfo}>
            <View style={styles.headerBackground}>
              <View style={styles.headerTop}>
                <Text style={styles.listEmoji}>{list.emoji}</Text>
                <View style={styles.headerStats}>
                  <View style={styles.statBadge}>
                    <Text style={styles.statValue}>{uncheckedItems.length}</Text>
                    <Text style={styles.statLabel}>to buy</Text>
                  </View>
                  <View style={styles.statBadge}>
                    <Text style={[styles.statValue, { color: Colors.success }]}>
                      {checkedItems.length}
                    </Text>
                    <Text style={styles.statLabel}>done</Text>
                  </View>
                </View>
              </View>
              {list.description && (
                <Text style={styles.headerDescription}>{list.description}</Text>
              )}
            </View>
          </View>

          {/* Filter Bar */}
          <View style={styles.filterBar}>
            <TouchableOpacity
              style={[styles.filterButton, !showChecked && styles.filterButtonActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowChecked(!showChecked);
              }}
            >
              <Ionicons
                name={showChecked ? 'eye-outline' : 'eye-off-outline'}
                size={18}
                color={showChecked ? Colors.textSecondary : Colors.primary}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  !showChecked && styles.filterButtonTextActive,
                ]}
              >
                {showChecked ? 'Hide Checked' : 'Show All'}
              </Text>
            </TouchableOpacity>

            {checkedItems.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearChecked}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
                <Text style={styles.clearButtonText}>Clear Checked</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Items List */}
          <FlatList
            data={displayItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.productId}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Add to Cart Button */}
          {uncheckedItems.length > 0 && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.addToCartButton}
                onPress={handleAddAllToCart}
                activeOpacity={0.9}
              >
                <View style={styles.addToCartOuter}>
                  <View style={styles.addToCartInner}>
                    <Ionicons name="cart" size={22} color={Colors.white} />
                    <Text style={styles.addToCartText}>
                      Add {uncheckedItems.length} to Cart
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.xs,
  },
  headerInfo: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerBackground: {
    backgroundColor: Colors.fashion.cream,
    padding: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  listEmoji: {
    fontSize: 48,
  },
  headerStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statBadge: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 60,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary + '15',
  },
  filterButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.primary,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.error + '15',
  },
  clearButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.error,
  },
  listContent: {
    padding: Spacing.md,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  checkboxContainer: {
    marginRight: Spacing.md,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  itemImageContainer: {
    marginRight: Spacing.md,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
  },
  itemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  itemName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: Colors.textLight,
  },
  itemPrice: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  emptyButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  addToCartButton: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.large,
  },
  addToCartOuter: {
    backgroundColor: Colors.fashion.ocean,
    padding: 3,
    borderRadius: BorderRadius.xl,
  },
  addToCartInner: {
    backgroundColor: Colors.fashion.azure,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md + 4,
    gap: Spacing.sm,
    borderRadius: BorderRadius.xl - 3,
  },
  addToCartText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
});
