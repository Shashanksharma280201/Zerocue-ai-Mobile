import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadows } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  color: string;
  description?: string;
  sizes?: string[];
  colors?: string[];
  inStock?: boolean;
}

interface ProductDetailDrawerProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, selectedSize: string, selectedColor: string) => void;
  onReserve: (product: Product, selectedSize: string, selectedColor: string) => void;
}

// Spotify-style color gradients
const getProductGradient = (color: string): [string, string] => {
  const colorMap: Record<string, [string, string]> = {
    'Beige': ['#F8F5F2', '#E8D5C4'],
    'White': ['#FFFFFF', '#F5F5F5'],
    'Gold': ['#FEF3C7', '#FDE68A'],
    'Black': ['#334155', '#1E293B'],
    'Blue': ['#DBEAFE', '#BFDBFE'],
    'Pink': ['#FCE7F3', '#FBCFE8'],
    'Green': ['#D1FAE5', '#A7F3D0'],
    'Brown': ['#E7E5E4', '#D6D3D1'],
    'Red': ['#FEE2E2', '#FECACA'],
    'Purple': ['#F3E8FF', '#E9D5FF'],
  };
  return colorMap[color] || ['#F8F5F2', '#E8D5C4'];
};

export default function ProductDetailDrawer({
  visible,
  product,
  onClose,
  onAddToCart,
  onReserve,
}: ProductDetailDrawerProps) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  // Reset selections when drawer closes or product changes
  useEffect(() => {
    if (!visible) {
      setSelectedSize('');
      setSelectedColor('');
    }
  }, [visible]);

  useEffect(() => {
    setSelectedSize('');
    setSelectedColor('');
  }, [product?.id]);

  if (!product) return null;

  const gradientColors = getProductGradient(product.color);
  const availableSizes = product.sizes || ['XS', 'S', 'M', 'L', 'XL'];
  const availableColors = product.colors || [product.color];
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!selectedSize) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Size Required', 'Please select a size before adding to cart');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAddToCart(product, selectedSize, selectedColor || product.color);
  };

  const handleReserve = () => {
    if (!selectedSize) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Size Required', 'Please select a size before reserving this item');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onReserve(product, selectedSize, selectedColor || product.color);
  };

  const handleSelectSize = (size: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSize(size);
  };

  const handleSelectColor = (color: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedColor(color);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.drawerContainer}>
          <LinearGradient
            colors={gradientColors}
            style={styles.drawerGradient}
          >
            <SafeAreaView edges={['bottom']} style={styles.drawerContent}>
              {/* Handle Bar */}
              <View style={styles.handleBar} />

              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
              >
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    <Text style={styles.brandName}>{product.brand}</Text>
                    <Text style={styles.productName}>{product.name}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={24} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Product Image Placeholder */}
                <View style={styles.productImage}>
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="shirt-outline" size={80} color={Colors.text} opacity={0.3} />
                  </View>
                  {product.inStock !== false && (
                    <View style={styles.stockBadge}>
                      <View style={styles.stockDot} />
                      <Text style={styles.stockText}>In Stock</Text>
                    </View>
                  )}
                </View>

                {/* Price */}
                <View style={styles.priceSection}>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>₹{product.price.toLocaleString()}</Text>
                    {product.originalPrice && (
                      <Text style={styles.originalPrice}>
                        ₹{product.originalPrice.toLocaleString()}
                      </Text>
                    )}
                  </View>
                  {discount > 0 && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{discount}% OFF</Text>
                    </View>
                  )}
                </View>

                {/* Description */}
                {product.description && (
                  <View style={styles.descriptionSection}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.description}>{product.description}</Text>
                  </View>
                )}

                {/* Size Selection */}
                <View style={styles.selectionSection}>
                  <Text style={styles.sectionTitle}>
                    Select Size {!selectedSize && <Text style={styles.required}>*</Text>}
                  </Text>
                  <View style={styles.sizesGrid}>
                    {availableSizes.map((size) => (
                      <TouchableOpacity
                        key={size}
                        style={[
                          styles.sizeButton,
                          selectedSize === size && styles.sizeButtonSelected,
                        ]}
                        onPress={() => handleSelectSize(size)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.sizeText,
                            selectedSize === size && styles.sizeTextSelected,
                          ]}
                        >
                          {size}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Color Selection */}
                {availableColors.length > 1 && (
                  <View style={styles.selectionSection}>
                    <Text style={styles.sectionTitle}>Select Color</Text>
                    <View style={styles.colorsRow}>
                      {availableColors.map((color) => (
                        <TouchableOpacity
                          key={color}
                          style={[
                            styles.colorButton,
                            selectedColor === color && styles.colorButtonSelected,
                          ]}
                          onPress={() => handleSelectColor(color)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.colorText,
                              selectedColor === color && styles.colorTextSelected,
                            ]}
                          >
                            {color}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Features */}
                <View style={styles.featuresSection}>
                  <View style={styles.featureItem}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={Colors.text} />
                    <Text style={styles.featureText}>100% Authentic</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="return-down-back-outline" size={20} color={Colors.text} />
                    <Text style={styles.featureText}>Easy Returns</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="car-outline" size={20} color={Colors.text} />
                    <Text style={styles.featureText}>Free Delivery over ₹2000</Text>
                  </View>
                </View>

                <View style={{ height: 20 }} />
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.reserveButton}
                  onPress={handleReserve}
                  activeOpacity={0.8}
                >
                  <Ionicons name="bookmark-outline" size={22} color={Colors.text} />
                  <Text style={styles.reserveButtonText}>Reserve Item</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.addToCartButton}
                  onPress={handleAddToCart}
                  activeOpacity={0.8}
                >
                  <Ionicons name="cart" size={22} color={Colors.white} />
                  <Text style={styles.addToCartText}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    height: height * 0.85,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    overflow: 'hidden',
    ...Shadows.large,
  },
  drawerGradient: {
    flex: 1,
  },
  drawerContent: {
    flex: 1,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  brandName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  productName: {
    fontSize: FontSize.xxl + 4,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '100%',
    height: width * 0.6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  stockText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.success,
    letterSpacing: 0.5,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.md,
  },
  price: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  originalPrice: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
  },
  discountText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  descriptionSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  },
  required: {
    color: Colors.error,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  selectionSection: {
    marginBottom: Spacing.lg,
  },
  sizesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm + 4,
  },
  sizeButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 60,
    alignItems: 'center',
  },
  sizeButtonSelected: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  sizeText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  sizeTextSelected: {
    color: Colors.white,
  },
  colorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm + 4,
  },
  colorButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonSelected: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  colorText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  colorTextSelected: {
    color: Colors.white,
  },
  featuresSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: FontWeight.medium,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
    backgroundColor: 'transparent',
  },
  reserveButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.text,
  },
  reserveButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.text,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.medium,
  },
  addToCartText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});
