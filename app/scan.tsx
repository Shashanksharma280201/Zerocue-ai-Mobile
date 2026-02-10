import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Animated, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadows } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useCartStore } from '../lib/stores/cartStore';

const { width, height } = Dimensions.get('window');

// Mock product database (ZeroCue grocery/retail items)
const MOCK_PRODUCTS: Record<string, any> = {
  '8901030123456': {
    id: '8901030123456',
    name: 'Organic Whole Wheat Bread',
    brand: 'Harvest Gold',
    price: 45,
    originalPrice: 55,
    category: 'Bakery',
    weight: '400g',
    inStock: true,
    image: null,
  },
  '8901234567890': {
    id: '8901234567890',
    name: 'Fresh Milk Full Cream',
    brand: 'Amul',
    price: 56,
    category: 'Dairy',
    weight: '1L',
    inStock: true,
    image: null,
  },
  '4567890123456': {
    id: '4567890123456',
    name: 'Premium Basmati Rice',
    brand: 'India Gate',
    price: 899,
    originalPrice: 999,
    category: 'Groceries',
    weight: '5kg',
    inStock: true,
    image: null,
  },
  '7890123456789': {
    id: '7890123456789',
    name: 'Dark Chocolate Bar',
    brand: 'Cadbury',
    price: 120,
    category: 'Confectionery',
    weight: '200g',
    inStock: true,
    image: null,
  },
  '1234567890123': {
    id: '1234567890123',
    name: 'Cold Pressed Olive Oil',
    brand: 'Figaro',
    price: 450,
    originalPrice: 550,
    category: 'Cooking Oil',
    weight: '500ml',
    inStock: true,
    image: null,
  },
};

export default function Scanner() {
  const router = useRouter();
  const { addItem, getItemCount } = useCartStore();
  const [scanning, setScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Simulate barcode scan (in real app, use expo-barcode-scanner)
  const simulateScan = () => {
    setScanning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Pulse animation while scanning
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Simulate finding a product after 1.5 seconds
    setTimeout(() => {
      const productIds = Object.keys(MOCK_PRODUCTS);
      const randomId = productIds[Math.floor(Math.random() * productIds.length)];
      const product = MOCK_PRODUCTS[randomId];

      setScannedProduct(product);
      setScanning(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Slide up product card
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 1500);
  };

  const handleAddToCart = () => {
    if (!scannedProduct) return;

    // Convert mock product to cart product format
    const cartProduct = {
      id: scannedProduct.id,
      name: scannedProduct.name,
      brand: scannedProduct.brand,
      mrp: scannedProduct.price,
      tax_rate: 5, // 5% GST
      category: scannedProduct.category,
    };

    addItem(cartProduct, quantity);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Show quick success feedback
    resetScanner();

    // Brief toast-style message (no blocking alert)
    setTimeout(() => {
      Alert.alert(
        '✓ Added to Cart',
        `${scannedProduct.name} (${quantity}x) is in your cart`,
        [
          { text: 'Continue Shopping', style: 'cancel' },
          {
            text: 'View Cart (' + getItemCount() + ')',
            onPress: () => router.push('/(tabs)/cart')
          },
        ]
      );
    }, 300);
  };

  const handleBuyNow = () => {
    if (!scannedProduct) return;

    // Add to cart first
    const cartProduct = {
      id: scannedProduct.id,
      name: scannedProduct.name,
      brand: scannedProduct.brand,
      mrp: scannedProduct.price,
      tax_rate: 5,
      category: scannedProduct.category,
    };

    addItem(cartProduct, quantity);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Go directly to cart/checkout
    resetScanner();
    setTimeout(() => {
      router.push('/(tabs)/cart');
    }, 200);
  };

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= 99) {
      setQuantity(newQty);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const resetScanner = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setScannedProduct(null);
      setQuantity(1); // Reset quantity for next scan
      slideAnim.setValue(height);
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Item</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Scanner Viewfinder */}
      <View style={styles.scannerContainer}>
        <View style={styles.viewfinder}>
          {/* Corner brackets */}
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />

          {/* Scanning animation */}
          {scanning && (
            <Animated.View
              style={[
                styles.scanningLine,
                { transform: [{ scale: pulseAnim }] }
              ]}
            />
          )}

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Ionicons
              name="barcode-outline"
              size={64}
              color={scanning ? Colors.primary : Colors.white}
            />
            <Text style={styles.instructionText}>
              {scanning ? 'Scanning...' : 'Point camera at barcode'}
            </Text>
          </View>
        </View>

        {/* Info Text */}
        <Text style={styles.infoText}>
          Scan product barcodes to add items to your cart and skip the checkout line
        </Text>
      </View>

      {/* Manual Scan Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.scanButton, scanning && styles.scanButtonDisabled]}
          onPress={simulateScan}
          disabled={scanning}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.accentPurple]}
            style={styles.scanButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="scan" size={26} color={Colors.white} />
            <Text style={styles.scanButtonText}>
              {scanning ? 'Scanning...' : 'Tap to Scan'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.tipText}>
          Scan multiple items and pay at once when you're done shopping
        </Text>
      </View>

      {/* Product Quick Action Card (slides up after scan) */}
      {scannedProduct && (
        <Animated.View
          style={[
            styles.productCard,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <SafeAreaView edges={['bottom']}>
            {/* Drag Handle */}
            <View style={styles.dragHandle} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.productContent}
            >
              {/* Product Image Placeholder */}
              <View style={styles.productImagePlaceholder}>
                <Ionicons name="cube-outline" size={48} color={Colors.textLight} />
              </View>

              {/* Product Info */}
              <View style={styles.productInfo}>
                {scannedProduct.originalPrice && (
                  <View style={styles.saleBadge}>
                    <Text style={styles.saleBadgeText}>
                      SALE {Math.round((1 - scannedProduct.price / scannedProduct.originalPrice) * 100)}% OFF
                    </Text>
                  </View>
                )}

                <Text style={styles.brandName}>{scannedProduct.brand}</Text>
                <Text style={styles.productName}>{scannedProduct.name}</Text>

                <View style={styles.priceRow}>
                  <Text style={styles.price}>₹{scannedProduct.price.toLocaleString()}</Text>
                  {scannedProduct.originalPrice && (
                    <Text style={styles.originalPrice}>₹{scannedProduct.originalPrice.toLocaleString()}</Text>
                  )}
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="pricetag-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>{scannedProduct.category}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="scale-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>{scannedProduct.weight}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={[styles.detailText, { color: Colors.success }]}>In Stock</Text>
                </View>

                {/* Quantity Selector */}
                <View style={styles.quantitySection}>
                  <Text style={styles.quantityLabel}>Quantity</Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                      onPress={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="remove" size={20} color={quantity <= 1 ? Colors.textMuted : Colors.text} />
                    </TouchableOpacity>

                    <Text style={styles.quantityValue}>{quantity}</Text>

                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleQuantityChange(1)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="add" size={20} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.actionsContainer}>
                {/* PRIMARY ACTION: Add to Cart (1 tap) */}
                <TouchableOpacity
                  style={styles.primaryAction}
                  onPress={handleAddToCart}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
                    style={styles.primaryActionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="cart" size={20} color={Colors.white} />
                    <Text style={styles.primaryActionText}>Add to Cart</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Secondary Action */}
                <TouchableOpacity
                  style={styles.buyNowButton}
                  onPress={handleBuyNow}
                  activeOpacity={0.9}
                >
                  <Ionicons name="flash" size={20} color={Colors.white} />
                  <Text style={styles.buyNowText}>Buy Now</Text>
                </TouchableOpacity>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={resetScanner}
              >
                <Text style={styles.closeButtonText}>Scan Another Item</Text>
              </TouchableOpacity>

              <View style={{ height: 20 }} />
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.accent.charcoal,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: -0.3,
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  viewfinder: {
    width: width * 0.8,
    height: width * 0.8,
    borderWidth: 2,
    borderColor: Colors.white,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.accent.sage,
    borderWidth: 4,
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: BorderRadius.xl,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: BorderRadius.xl,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: BorderRadius.xl,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: BorderRadius.xl,
  },
  scanningLine: {
    position: 'absolute',
    width: '80%',
    height: 3,
    backgroundColor: Colors.accent.sage,
    borderRadius: 2,
  },
  instructionsContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: FontWeight.normal,
  },
  infoText: {
    marginTop: Spacing.xl,
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 18,
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  scanButton: {
    width: '100%',
    height: 56,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  tipText: {
    marginTop: Spacing.md,
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 16,
  },
  productCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    height: height * 0.7,
    ...Shadows.large,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  productContent: {
    paddingBottom: Spacing.xxl,
  },
  productImagePlaceholder: {
    width: width - (Spacing.lg * 2),
    height: 140,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
  },
  productInfo: {
    paddingHorizontal: Spacing.lg,
  },
  saleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  saleBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  brandName: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  productName: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    letterSpacing: -0.2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  price: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  originalPrice: {
    fontSize: 14,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  detailText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  quantitySection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    minWidth: 36,
    textAlign: 'center',
  },
  sizesContainer: {
    marginTop: Spacing.lg,
  },
  sizesLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  sizeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  sizeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sizeChipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  actionsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  primaryAction: {
    height: 50,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.small,
  },
  primaryActionGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  primaryActionText: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  buyNowButton: {
    height: 50,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.small,
  },
  buyNowText: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  closeButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
});
