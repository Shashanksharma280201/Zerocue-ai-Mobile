import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { Product, StoreInventory } from '../../lib/types';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useCartStore } from '../../lib/stores/cartStore';
import { useAuthStore } from '../../lib/stores/authStore';
import { useWishlistStore } from '../../lib/stores/wishlistStore';
import { useShoppingListStore } from '../../lib/stores/shoppingListStore';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const IMAGE_HEIGHT = screenHeight * 0.45;

export default function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [inventory, setInventory] = useState<StoreInventory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showListModal, setShowListModal] = useState(false);

  const { addItem } = useCartStore();
  const { currentStore } = useAuthStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { lists, addItemToList } = useShoppingListStore();

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // For now, mock data based on productId
      const mockProduct: Product = {
        id: productId,
        tenant_id: 'tenant-1',
        sku: `SKU-${productId}`,
        barcode: `123456789${productId}`,
        name: 'Sample Product',
        description: 'This is a detailed description of the product. It contains all the important information about the product features, benefits, and specifications.',
        mrp: 499.00,
        tax_rate: 18,
        category: 'Electronics',
        attributes: {
          brand: 'Samsung',
          color: 'Black',
          size: 'Medium',
          weight: '500g',
        },
        media: [
          'https://via.placeholder.com/600x600?text=Product+Image+1',
          'https://via.placeholder.com/600x600?text=Product+Image+2',
          'https://via.placeholder.com/600x600?text=Product+Image+3',
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockInventory: StoreInventory = {
        id: 'inv-1',
        store_id: currentStore?.id || 'store-1',
        product_id: productId,
        qty_on_hand: 25,
        reorder_point: 10,
      };

      setProduct(mockProduct);
      setInventory(mockInventory);
    } catch (error) {
      console.error('Load product error:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    addItem(product, quantity);
    Alert.alert('Success', `${quantity}x ${product.name} added to cart`, [
      { text: 'Continue Shopping', onPress: () => router.back() },
      { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') },
    ]);
  };

  const handleAddToList = (listId: string) => {
    if (!product) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addItemToList(listId, product, quantity);
    setShowListModal(false);
    Alert.alert('Added to List', `${product.name} added to shopping list`);
  };

  const handleOpenListModal = () => {
    if (lists.length === 0) {
      Alert.alert(
        'No Lists',
        'Create a shopping list first to add items',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create List', onPress: () => router.push('/shopping-lists') },
        ]
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowListModal(true);
  };

  const incrementQuantity = () => {
    if (inventory && quantity < inventory.qty_on_hand) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const calculateTax = (price: number, taxRate: number) => {
    return (price * taxRate) / 100;
  };

  const calculateTotal = () => {
    if (!product) return 0;
    const tax = calculateTax(product.mrp, product.tax_rate);
    return (product.mrp + tax) * quantity;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="alert-circle-outline" size={64} color={Colors.textSecondary} />
        <Text style={styles.errorText}>Product not found</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  const images = product.media && product.media.length > 0 ? product.media : [product.image || 'https://via.placeholder.com/600x600'];
  const isInStock = inventory ? inventory.qty_on_hand > 0 : false;
  const stockStatus = !inventory
    ? 'Checking stock...'
    : inventory.qty_on_hand === 0
    ? 'Out of Stock'
    : inventory.qty_on_hand <= (inventory.reorder_point || 10)
    ? `Low Stock (${inventory.qty_on_hand} left)`
    : `In Stock (${inventory.qty_on_hand} available)`;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header with transparent background over image */}
      <View style={styles.header}>
        <BlurView intensity={80} style={styles.headerBlur}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerRightButtons}>
            <TouchableOpacity
              style={styles.wishlistButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                toggleWishlist(product);
              }}
            >
              <Ionicons
                name={isInWishlist(product.id) ? 'heart' : 'heart-outline'}
                size={24}
                color={isInWishlist(product.id) ? Colors.error : Colors.text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.listButton}
              onPress={handleOpenListModal}
            >
              <Ionicons name="list-outline" size={24} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              setActiveImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {images.map((imageUrl, index) => (
              <Image
                key={index}
                source={{ uri: imageUrl }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Image indicator dots */}
          {images.length > 1 && (
            <View style={styles.imageIndicatorContainer}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.imageIndicatorDot,
                    activeImageIndex === index && styles.imageIndicatorDotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Gradient overlay at bottom of image */}
          <LinearGradient
            colors={['transparent', Colors.background]}
            style={styles.imageGradient}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Category Badge */}
          {product.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
          )}

          {/* Product Name */}
          <Text style={styles.productName}>{product.name}</Text>

          {/* SKU & Barcode */}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>SKU: {product.sku}</Text>
            <Text style={styles.metaText}>Barcode: {product.barcode}</Text>
          </View>

          {/* Price Card */}
          <Card style={styles.priceCard}>
            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>Price</Text>
                <Text style={styles.priceValue}>₹{product.mrp.toFixed(2)}</Text>
              </View>
              <View style={styles.taxInfo}>
                <Text style={styles.taxLabel}>+ {product.tax_rate}% GST</Text>
                <Text style={styles.taxValue}>₹{calculateTax(product.mrp, product.tax_rate).toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Price (per unit)</Text>
              <Text style={styles.totalValue}>
                ₹{(product.mrp + calculateTax(product.mrp, product.tax_rate)).toFixed(2)}
              </Text>
            </View>
          </Card>

          {/* Stock Status */}
          <Card style={[styles.stockCard, !isInStock && styles.stockCardOutOfStock]}>
            <Ionicons
              name={isInStock ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={isInStock ? Colors.success : Colors.error}
            />
            <Text style={[styles.stockText, !isInStock && styles.stockTextOutOfStock]}>
              {stockStatus}
            </Text>
          </Card>

          {/* Description */}
          {product.description && (
            <Card style={styles.descriptionCard}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </Card>
          )}

          {/* Attributes */}
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <Card style={styles.attributesCard}>
              <Text style={styles.sectionTitle}>Specifications</Text>
              {Object.entries(product.attributes).map(([key, value]) => (
                <View key={key} style={styles.attributeRow}>
                  <Text style={styles.attributeKey}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                  <Text style={styles.attributeValue}>{String(value)}</Text>
                </View>
              ))}
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <BlurView intensity={80} style={styles.bottomBarBlur}>
          {/* Quantity Selector */}
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              onPress={decrementQuantity}
              style={[styles.quantityButton, quantity === 1 && styles.quantityButtonDisabled]}
              disabled={quantity === 1}
            >
              <Ionicons name="remove" size={20} color={quantity === 1 ? Colors.textSecondary : Colors.text} />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              onPress={incrementQuantity}
              style={[styles.quantityButton, inventory && quantity >= inventory.qty_on_hand && styles.quantityButtonDisabled]}
              disabled={inventory ? quantity >= inventory.qty_on_hand : false}
            >
              <Ionicons name="add" size={20} color={inventory && quantity >= inventory.qty_on_hand ? Colors.textSecondary : Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Add to Cart Button */}
          <View style={styles.addToCartContainer}>
            <View>
              <Text style={styles.totalPriceLabel}>Total</Text>
              <Text style={styles.totalPriceValue}>₹{calculateTotal().toFixed(2)}</Text>
            </View>
            <Button
              title="Add to Cart"
              onPress={handleAddToCart}
              disabled={!isInStock}
              style={styles.addToCartButton}
            />
          </View>
        </BlurView>
      </View>

      {/* Add to Shopping List Modal */}
      <Modal
        visible={showListModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowListModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add to Shopping List</Text>
              <TouchableOpacity
                onPress={() => setShowListModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={lists}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.listOptionCard}
                  onPress={() => handleAddToList(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.listOptionEmoji}>{item.emoji}</Text>
                  <View style={styles.listOptionInfo}>
                    <Text style={styles.listOptionName}>{item.name}</Text>
                    <Text style={styles.listOptionCount}>
                      {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listOptionsContainer}
            />

            <TouchableOpacity
              style={styles.createNewListButton}
              onPress={() => {
                setShowListModal(false);
                router.push('/shopping-lists');
              }}
            >
              <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
              <Text style={styles.createNewListText}>Create New List</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  errorText: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 50,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerBlur: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRightButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  wishlistButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: IMAGE_HEIGHT,
  },
  productImage: {
    width: screenWidth,
    height: IMAGE_HEIGHT,
  },
  imageIndicatorContainer: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white + '60',
    marginHorizontal: 4,
  },
  imageIndicatorDotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 150, // Space for bottom bar
  },
  categoryBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  categoryText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  productName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    lineHeight: 32,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  priceCard: {
    marginBottom: Spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  taxInfo: {
    alignItems: 'flex-end',
  },
  taxLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  taxValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  priceDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  stockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.successLight,
  },
  stockCardOutOfStock: {
    backgroundColor: Colors.errorLight,
  },
  stockText: {
    marginLeft: Spacing.sm,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.success,
  },
  stockTextOutOfStock: {
    color: Colors.error,
  },
  descriptionCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  descriptionText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  attributesCard: {
    marginBottom: Spacing.md,
  },
  attributeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  attributeKey: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  attributeValue: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  bottomBarBlur: {
    padding: Spacing.lg,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: Colors.backgroundSecondary,
  },
  quantityText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginHorizontal: Spacing.xl,
    minWidth: 40,
    textAlign: 'center',
  },
  addToCartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalPriceLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  totalPriceValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  addToCartButton: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listOptionsContainer: {
    paddingBottom: Spacing.md,
  },
  listOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  listOptionEmoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  listOptionInfo: {
    flex: 1,
  },
  listOptionName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  listOptionCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  createNewListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginTop: Spacing.sm,
  },
  createNewListText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
});
