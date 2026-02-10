import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Animated, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadows } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useCartStore } from '../lib/stores/cartStore';
import { fetchProductByBarcode } from '../lib/api/products';

const { width, height } = Dimensions.get('window');

// Color gradients for product drawer
const getProductGradient = (category: string): [string, string] => {
  const gradientMap: Record<string, [string, string]> = {
    'Jackets': ['#E3F2FD', '#90CAF9'],
    'T-Shirts': [Colors.cream[50], Colors.cream[200]],
    'Pants': ['#F3E5F5', '#CE93D8'],
    'Hoodies': ['#FFF3E0', '#FFB74D'],
    'Dresses': ['#FCE4EC', '#F48FB1'],
    'Footwear': ['#E8F5E9', '#81C784'],
  };
  return gradientMap[category] || [Colors.primaryLight, Colors.primary];
};

export default function BarcodeScanner() {
  const router = useRouter();
  const { addItem, getItemCount } = useCartStore();

  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();

  // Scanner state
  const [scanning, setScanning] = useState(true);
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [showProductDrawer, setShowProductDrawer] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  // Handle barcode scan
  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    // Prevent duplicate scans
    if (!scanning || lastScannedCode === data || loading) return;

    setLastScannedCode(data);
    setScanning(false);
    setLoading(true);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Fetch product from Supabase by barcode
      const product = await fetchProductByBarcode(data);

      if (product) {
        setScannedProduct(product);
        setShowProductDrawer(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        // Product not found
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Product Not Found',
          `Barcode ${data} not found in our catalog. Please scan another item or ask staff for help.`,
          [
            { text: 'Try Again', onPress: resetScanner }
          ]
        );
        resetScanner();
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        'Could not fetch product details. Please check your connection and try again.',
        [
          { text: 'Try Again', onPress: resetScanner }
        ]
      );
      resetScanner();
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!scannedProduct) return;

    addItem(scannedProduct, quantity);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    resetScanner();

    setTimeout(() => {
      Alert.alert(
        '✓ Added to Cart',
        `${scannedProduct.name} (${quantity}x) is in your cart`,
        [
          { text: 'Continue Shopping', style: 'cancel' },
          {
            text: `View Cart (${getItemCount()})`,
            onPress: () => router.push('/(tabs)/cart')
          },
        ]
      );
    }, 300);
  };

  const handleBuyNow = () => {
    if (!scannedProduct) return;

    addItem(scannedProduct, quantity);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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
    setShowProductDrawer(false);
    setTimeout(() => {
      setScannedProduct(null);
      setQuantity(1);
      setLastScannedCode(null);
      setScanning(true);
    }, 300); // Delay to allow drawer to close smoothly
  };

  // Request permission UI
  if (!permission) {
    return <View style={styles.container}><ActivityIndicator /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.permissionContainer}>
          <Ionicons name="camera-off" size={64} color={Colors.textLight} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            ZeroCue needs camera access to scan product barcodes
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

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
        <TouchableOpacity style={styles.helpButton} onPress={() => {
          Alert.alert(
            'How to Scan',
            '1. Point camera at barcode\n2. Hold steady for 1-2 seconds\n3. Product will appear automatically\n4. Add to cart or buy now',
            [{ text: 'Got it' }]
          );
        }}>
          <Ionicons name="help-circle-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: [
              'ean13',
              'ean8',
              'upc_a',
              'upc_e',
              'code128',
              'code39',
              'qr',
            ],
          }}
          onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
        >
          {/* Scanning overlay */}
          <View style={styles.overlay}>
            {/* Top dim area */}
            <View style={styles.dimArea} />

            {/* Middle row with viewfinder */}
            <View style={styles.middleRow}>
              <View style={styles.dimArea} />

              {/* Viewfinder */}
              <View style={styles.viewfinder}>
                {/* Corner brackets */}
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />

                {/* Loading indicator */}
                {loading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.white} />
                    <Text style={styles.loadingText}>Fetching product...</Text>
                  </View>
                )}
              </View>

              <View style={styles.dimArea} />
            </View>

            {/* Bottom dim area */}
            <View style={styles.dimArea} />
          </View>
        </CameraView>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Ionicons
            name="barcode-outline"
            size={32}
            color={Colors.white}
          />
          <Text style={styles.instructionText}>
            {loading ? 'Searching product...' : 'Align barcode in the frame'}
          </Text>
        </View>
      </View>

      {/* Product Drawer */}
      {scannedProduct && (
        <ProductDrawer
          visible={showProductDrawer}
          product={scannedProduct}
          quantity={quantity}
          onClose={resetScanner}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          onQuantityChange={handleQuantityChange}
        />
      )}
    </View>
  );
}

// Product Drawer Component
interface ProductDrawerProps {
  visible: boolean;
  product: any;
  quantity: number;
  onClose: () => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onQuantityChange: (delta: number) => void;
}

function ProductDrawer({
  visible,
  product,
  quantity,
  onClose,
  onAddToCart,
  onBuyNow,
  onQuantityChange,
}: ProductDrawerProps) {
  const gradientColors = getProductGradient(product.category || 'Product');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={gradientColors}
        style={styles.drawerGradient}
      >
        <SafeAreaView edges={['top', 'bottom']} style={styles.drawerContainer}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.drawerHeaderLeft}>
              <View style={styles.successBadge}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                <Text style={styles.successText}>Product Found</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.drawerCloseButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.drawerScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.drawerContent}
          >
            {/* Large Product Image Placeholder */}
            <View style={styles.drawerImageContainer}>
              <View style={styles.drawerImagePlaceholder}>
                <Ionicons
                  name={product.category === 'Footwear' ? 'footsteps-outline' : 'shirt-outline'}
                  size={120}
                  color={Colors.text}
                  opacity={0.15}
                />
              </View>

              {/* Category Badge */}
              <View style={styles.categoryBadge}>
                <Ionicons name="pricetag" size={14} color={Colors.text} />
                <Text style={styles.categoryBadgeText}>{product.category || 'Product'}</Text>
              </View>
            </View>

            {/* Product Details */}
            <View style={styles.drawerProductInfo}>
              <Text style={styles.drawerBrand}>{product.attributes?.brand || 'Brand'}</Text>
              <Text style={styles.drawerProductName}>{product.name}</Text>

              {/* Price */}
              <View style={styles.drawerPriceContainer}>
                <Text style={styles.drawerPrice}>₹{product.mrp.toLocaleString()}</Text>
                <View style={styles.taxBadge}>
                  <Text style={styles.taxText}>{product.tax_rate}% GST</Text>
                </View>
              </View>

              {/* Product Attributes */}
              <View style={styles.attributesGrid}>
                {product.attributes?.material && (
                  <View style={styles.attributeCard}>
                    <Ionicons name="layers-outline" size={20} color={Colors.text} />
                    <Text style={styles.attributeLabel}>Material</Text>
                    <Text style={styles.attributeValue}>{product.attributes.material}</Text>
                  </View>
                )}
                {product.attributes?.fit && (
                  <View style={styles.attributeCard}>
                    <Ionicons name="resize-outline" size={20} color={Colors.text} />
                    <Text style={styles.attributeLabel}>Fit</Text>
                    <Text style={styles.attributeValue}>{product.attributes.fit}</Text>
                  </View>
                )}
              </View>

              {/* SKU and Barcode */}
              <View style={styles.metaInfo}>
                <View style={styles.metaRow}>
                  <Ionicons name="cube-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>SKU: {product.sku}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="barcode-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>Barcode: {product.barcode}</Text>
                </View>
              </View>

              {/* Quantity Selector */}
              <View style={styles.drawerQuantitySection}>
                <Text style={styles.drawerQuantityLabel}>Select Quantity</Text>
                <View style={styles.drawerQuantityControls}>
                  <TouchableOpacity
                    style={[
                      styles.drawerQuantityButton,
                      quantity <= 1 && styles.drawerQuantityButtonDisabled
                    ]}
                    onPress={() => onQuantityChange(-1)}
                    disabled={quantity <= 1}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="remove"
                      size={24}
                      color={quantity <= 1 ? Colors.textLight : Colors.text}
                    />
                  </TouchableOpacity>

                  <View style={styles.quantityDisplay}>
                    <Text style={styles.drawerQuantityValue}>{quantity}</Text>
                    <Text style={styles.quantityUnit}>items</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.drawerQuantityButton}
                    onPress={() => onQuantityChange(1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={24} color={Colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Item Total */}
              <View style={styles.itemTotalCard}>
                <View style={styles.itemTotalRow}>
                  <Text style={styles.itemTotalLabel}>Item Total</Text>
                  <Text style={styles.itemTotalValue}>
                    ₹{(product.mrp * quantity).toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.itemTotalHint}>Including {product.tax_rate}% GST</Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.drawerActions}>
            <TouchableOpacity
              style={styles.drawerAddToCartButton}
              onPress={onAddToCart}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
                style={styles.drawerActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="cart" size={22} color={Colors.white} />
                <Text style={styles.drawerActionText}>Add to Cart</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerBuyNowButton}
              onPress={onBuyNow}
              activeOpacity={0.9}
            >
              <Ionicons name="flash" size={22} color={Colors.white} />
              <Text style={styles.drawerBuyNowText}>Buy Now</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  dimArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  middleRow: {
    flexDirection: 'row',
    height: width * 0.7,
  },
  viewfinder: {
    width: width * 0.7,
    height: width * 0.7,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.accent.sage,
    borderWidth: 4,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: FontWeight.medium,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: FontWeight.medium,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  permissionTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  permissionButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  // Product Drawer Styles
  drawerGradient: {
    flex: 1,
  },
  drawerContainer: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  drawerHeaderLeft: {
    flex: 1,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  successText: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.success,
  },
  drawerCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
  },
  drawerScroll: {
    flex: 1,
  },
  drawerContent: {
    padding: Spacing.lg,
  },
  drawerImageContainer: {
    width: '100%',
    height: width * 0.8,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  drawerImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    ...Shadows.small,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  drawerProductInfo: {
    gap: Spacing.md,
  },
  drawerBrand: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.8,
  },
  drawerProductName: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  drawerPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  drawerPrice: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  taxBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  taxText: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  attributesGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  attributeCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  attributeLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: FontWeight.medium,
  },
  attributeValue: {
    fontSize: 14,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  metaInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  drawerQuantitySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  drawerQuantityLabel: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  drawerQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  drawerQuantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },
  drawerQuantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityDisplay: {
    alignItems: 'center',
    gap: 4,
  },
  drawerQuantityValue: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    minWidth: 60,
    textAlign: 'center',
  },
  quantityUnit: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  itemTotalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  itemTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  itemTotalLabel: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemTotalValue: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  itemTotalHint: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  drawerActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.5)',
  },
  drawerAddToCartButton: {
    flex: 1,
    height: 54,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  drawerActionGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  drawerActionText: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  drawerBuyNowButton: {
    flex: 1,
    height: 54,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.medium,
  },
  drawerBuyNowText: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
});
