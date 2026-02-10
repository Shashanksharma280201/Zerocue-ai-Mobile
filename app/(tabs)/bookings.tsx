import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadows } from '../../constants/Colors';

const { width, height } = Dimensions.get('window');

// Dummy scanned product (simulated)
const DUMMY_PRODUCT = {
  id: '1',
  name: 'Linen Co-ord Set',
  brand: 'Zara',
  price: 2499,
  originalPrice: 3999,
  size: 'M',
  color: 'Beige',
  inStock: true,
  image: null,
};

export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<typeof DUMMY_PRODUCT | null>(null);
  const [flashOn, setFlashOn] = useState(false);

  // Auto-start scanning if permission is already granted
  useEffect(() => {
    if (permission?.granted && !scanning && !scannedProduct) {
      setScanning(true);
    }
  }, [permission?.granted]);

  const handleBarcodeScan = ({ data }: { data: string }) => {
    if (!scanning) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setScanning(false);

    // Simulate finding a product
    setTimeout(() => {
      setScannedProduct(DUMMY_PRODUCT);
    }, 300);
  };

  const handleAddToCart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Added to Cart',
      `${scannedProduct?.name} has been added to your cart`,
      [{ text: 'OK', onPress: () => setScannedProduct(null) }]
    );
  };

  const handleManualEntry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Manual Entry', 'Enter product code manually', [
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const toggleFlash = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlashOn(!flashOn);
  };

  const startScanning = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScanning(true);
    setScannedProduct(null);
  };

  // Permission states
  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="camera-outline" size={80} color={Colors.textLight} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Allow camera access to scan product barcodes and discover fashion items instantly
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" size={20} color={Colors.text} />
            <Text style={styles.permissionButtonText}>Enable Camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Scanned product result with solid background
  if (scannedProduct && !scanning) {
    return (
      <View style={styles.container}>
        <View style={styles.resultBackground}>
          <SafeAreaView edges={['top', 'bottom']} style={styles.resultContainer}>
            {/* Header */}
            <View style={styles.resultHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setScannedProduct(null);
                }}
              >
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Product Image Placeholder with gradient background */}
            <View style={styles.productImageLarge}>
              <View style={styles.imagePlaceholderLarge}>
                <Ionicons name="checkmark-circle" size={60} color={Colors.success} />
                <Text style={styles.successText}>Product Found!</Text>
              </View>
            </View>

            {/* Product Info */}
            <View style={styles.productDetails}>
              <Text style={styles.brandNameLarge}>{scannedProduct.brand}</Text>
              <Text style={styles.productNameLarge}>{scannedProduct.name}</Text>

              {/* Price */}
              <View style={styles.priceRowLarge}>
                <Text style={styles.priceLarge}>₹{scannedProduct.price.toLocaleString()}</Text>
                {scannedProduct.originalPrice && (
                  <>
                    <Text style={styles.originalPriceLarge}>
                      ₹{scannedProduct.originalPrice.toLocaleString()}
                    </Text>
                    <View style={styles.discountBadgeLarge}>
                      <Text style={styles.discountTextLarge}>
                        {Math.round((1 - scannedProduct.price / scannedProduct.originalPrice) * 100)}% OFF
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {/* Details */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Size</Text>
                  <Text style={styles.detailValue}>{scannedProduct.size}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Color</Text>
                  <Text style={styles.detailValue}>{scannedProduct.color}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Stock</Text>
                  <View style={styles.stockBadge}>
                    <View style={styles.stockDot} />
                    <Text style={styles.stockText}>In Stock</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Actions - Fixed at bottom */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.addToCartButton}
                onPress={handleAddToCart}
                activeOpacity={0.8}
              >
                <Ionicons name="cart" size={20} color={Colors.text} />
                <Text style={styles.addToCartText}>Add to Cart</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scanAgainButton}
                onPress={startScanning}
                activeOpacity={0.8}
              >
                <Text style={styles.scanAgainText}>Scan Another</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </View>
    );
  }

  // Camera scanner view
  return (
    <View style={styles.container}>
      {scanning ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'code128', 'code39', 'qr'],
            }}
            onBarcodeScanned={handleBarcodeScan}
            enableTorch={flashOn}
          />
          {/* Scanner Overlay */}
          <SafeAreaView edges={['top']} style={styles.scannerOverlay}>
              {/* Top Controls */}
              <View style={styles.topControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setScanning(false);
                  }}
                >
                  <Ionicons name="close" size={28} color={Colors.white} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlButton, flashOn && styles.controlButtonActive]}
                  onPress={toggleFlash}
                >
                  <Ionicons
                    name={flashOn ? 'flash' : 'flash-outline'}
                    size={24}
                    color={Colors.white}
                  />
                </TouchableOpacity>
              </View>

              {/* Scanner Frame */}
              <View style={styles.scannerFrameContainer}>
                <View style={styles.scannerFrame}>
                  <View style={[styles.corner, styles.cornerTopLeft]} />
                  <View style={[styles.corner, styles.cornerTopRight]} />
                  <View style={[styles.corner, styles.cornerBottomLeft]} />
                  <View style={[styles.corner, styles.cornerBottomRight]} />
                </View>
                <Text style={styles.scannerInstruction}>
                  Position barcode or QR code within frame
                </Text>
              </View>

              {/* Bottom Actions */}
              <View style={styles.bottomControls}>
                <TouchableOpacity
                  style={styles.manualEntryButton}
                  onPress={handleManualEntry}
                  activeOpacity={0.8}
                >
                  <Ionicons name="keypad-outline" size={20} color={Colors.white} />
                  <Text style={styles.manualEntryText}>Manual Entry</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
      ) : (
        <SafeAreaView edges={['top', 'bottom']} style={styles.welcomeContainer}>
          {/* Welcome State */}
          <View style={styles.welcomeContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="scan" size={80} color={Colors.text} />
            </View>

            <Text style={styles.welcomeTitle}>Scan & Shop</Text>
            <Text style={styles.welcomeSubtitle}>
              Scan product barcodes or QR codes to instantly view details, prices, and add items to your cart
            </Text>

            {/* Features */}
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="flash-outline" size={24} color={Colors.text} />
                <Text style={styles.featureText}>Fast barcode scanning</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="information-circle-outline" size={24} color={Colors.text} />
                <Text style={styles.featureText}>Instant product details</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="cart-outline" size={24} color={Colors.text} />
                <Text style={styles.featureText}>Quick add to cart</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.startScanButton}
              onPress={startScanning}
              activeOpacity={0.8}
            >
              <Ionicons name="scan" size={24} color={Colors.text} />
              <Text style={styles.startScanText}>Start Scanning</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
  },
  permissionTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  permissionButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.medium,
  },
  permissionButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  scannerFrameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderColor: Colors.white,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: 8,
  },
  scannerInstruction: {
    fontSize: FontSize.lg,
    color: Colors.white,
    textAlign: 'center',
    marginTop: Spacing.xl + Spacing.md,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.3,
    paddingHorizontal: Spacing.xl,
  },
  bottomControls: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  manualEntryButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  manualEntryText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  welcomeContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  welcomeContent: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl + Spacing.md,
    ...Shadows.small,
  },
  welcomeTitle: {
    fontSize: 40,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
    letterSpacing: -1,
  },
  welcomeSubtitle: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: Spacing.xl + Spacing.lg,
    maxWidth: 320,
  },
  featuresList: {
    width: '100%',
    marginBottom: Spacing.xl + Spacing.md,
    gap: Spacing.md + 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.md + 4,
    borderRadius: BorderRadius.lg,
  },
  featureText: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
  startScanButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl + Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.large,
  },
  startScanText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: 0.3,
  },
  resultBackground: {
    flex: 1,
    backgroundColor: Colors.fashion.cream,
  },
  resultContainer: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  closeButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
    ...Shadows.medium,
  },
  productImageLarge: {
    width: width,
    height: width * 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  imagePlaceholderLarge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  successText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.success,
  },
  productDetails: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  brandNameLarge: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  productNameLarge: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  priceRowLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
  },
  priceLarge: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -1,
  },
  originalPriceLarge: {
    fontSize: FontSize.md,
    color: Colors.textLight,
    textDecorationLine: 'line-through',
  },
  discountBadgeLarge: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  discountTextLarge: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  detailItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  detailLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: FontWeight.semibold,
  },
  detailValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  stockText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.success,
  },
  actionsContainer: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  addToCartButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.medium,
  },
  addToCartText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  scanAgainButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  scanAgainText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
});
