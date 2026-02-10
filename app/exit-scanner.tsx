import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '../constants/Colors';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const { width, height } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

type ReceiptStatus = 'valid' | 'used' | 'expired' | 'invalid';

interface ScannedReceipt {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  items: Array<{
    name: string;
    qty: number;
    price: number;
  }>;
  timestamp: string;
  status: ReceiptStatus;
}

export default function ExitScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedReceipt, setScannedReceipt] = useState<ScannedReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (isProcessing || !isScanning) return;

    setIsProcessing(true);
    setIsScanning(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // TODO: Replace with actual API call to verify receipt
      // const response = await verifyReceipt(data);

      // Mock verification
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock receipt data
      const mockReceipt: ScannedReceipt = {
        id: data,
        orderNumber: data.slice(0, 8).toUpperCase(),
        customerName: 'Customer',
        total: 1499.00,
        items: [
          { name: 'Product 1', qty: 2, price: 499.00 },
          { name: 'Product 2', qty: 1, price: 501.00 },
        ],
        timestamp: new Date().toLocaleString('en-IN'),
        status: 'valid', // Can be 'valid', 'used', 'expired', 'invalid'
      };

      // Randomly simulate different statuses for demo
      const statuses: ReceiptStatus[] = ['valid', 'used', 'expired', 'invalid'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      mockReceipt.status = randomStatus;

      setScannedReceipt(mockReceipt);
      setError(null);

      if (mockReceipt.status === 'valid') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setError('Failed to verify receipt. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => {
        setIsScanning(true);
        setError(null);
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveExit = async () => {
    if (!scannedReceipt) return;

    try {
      // TODO: Mark receipt as used in backend
      // await markReceiptAsUsed(scannedReceipt.id);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Exit Approved',
        `Customer ${scannedReceipt.orderNumber} approved to exit`,
        [
          {
            text: 'Scan Next',
            onPress: handleScanNext,
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', 'Failed to approve exit. Please try again.');
    }
  };

  const handleScanNext = () => {
    setScannedReceipt(null);
    setError(null);
    setIsScanning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan customer receipts at exit
          </Text>
          <Button title="Grant Permission" onPress={requestPermission} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient
        colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exit Scanner</Text>
        <View style={styles.backButton} />
      </LinearGradient>

      {isScanning && !scannedReceipt && (
        <>
          {/* Camera View */}
          <CameraView
            style={styles.camera}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          >
            {/* Scan Frame Overlay */}
            <View style={styles.overlay}>
              <View style={styles.topOverlay} />
              <View style={styles.middleRow}>
                <View style={styles.sideOverlay} />
                <View style={styles.scanFrame}>
                  <View style={[styles.corner, styles.cornerTopLeft]} />
                  <View style={[styles.corner, styles.cornerTopRight]} />
                  <View style={[styles.corner, styles.cornerBottomLeft]} />
                  <View style={[styles.corner, styles.cornerBottomRight]} />
                </View>
                <View style={styles.sideOverlay} />
              </View>
              <View style={styles.bottomOverlay}>
                <View style={styles.instructionCard}>
                  <Text style={styles.instructionText}>
                    Align customer's QR receipt within the frame
                  </Text>
                </View>
              </View>
            </View>

            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color={Colors.white} />
                <Text style={styles.processingText}>Verifying receipt...</Text>
              </View>
            )}
          </CameraView>

          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color={Colors.error} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}
        </>
      )}

      {scannedReceipt && (
        <View style={styles.resultContainer}>
          {/* Status Card */}
          <Card
            style={[
              styles.statusCard,
              scannedReceipt.status === 'valid' && styles.statusCardValid,
              scannedReceipt.status !== 'valid' && styles.statusCardInvalid,
            ]}
          >
            <View style={styles.statusHeader}>
              <Ionicons
                name={
                  scannedReceipt.status === 'valid'
                    ? 'checkmark-circle'
                    : 'close-circle'
                }
                size={48}
                color={scannedReceipt.status === 'valid' ? Colors.success : Colors.error}
              />
              <View>
                <Text style={styles.statusTitle}>
                  {scannedReceipt.status === 'valid' && 'Valid Receipt'}
                  {scannedReceipt.status === 'used' && 'Already Used'}
                  {scannedReceipt.status === 'expired' && 'Expired Receipt'}
                  {scannedReceipt.status === 'invalid' && 'Invalid Receipt'}
                </Text>
                <Text style={styles.orderNumber}>#{scannedReceipt.orderNumber}</Text>
              </View>
            </View>
          </Card>

          {/* Receipt Details */}
          <Card style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Order Details</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Customer:</Text>
              <Text style={styles.infoValue}>{scannedReceipt.customerName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Time:</Text>
              <Text style={styles.infoValue}>{scannedReceipt.timestamp}</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.itemsTitle}>Items ({scannedReceipt.items.length})</Text>
            {scannedReceipt.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQty}>Qty: {item.qty}</Text>
                </View>
                <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{scannedReceipt.total.toFixed(2)}</Text>
            </View>
          </Card>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {scannedReceipt.status === 'valid' ? (
              <>
                <Button
                  title="Approve Exit"
                  onPress={handleApproveExit}
                  style={styles.approveButton}
                />
                <TouchableOpacity
                  style={styles.denyButton}
                  onPress={handleScanNext}
                >
                  <Text style={styles.denyButtonText}>Deny & Scan Next</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Button
                title="Scan Next Receipt"
                onPress={handleScanNext}
                style={styles.scanNextButton}
              />
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  permissionTitle: {
    fontSize: FontSize.xl,
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
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  middleRow: {
    flexDirection: 'row',
    height: SCAN_AREA_SIZE,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scanFrame: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: Colors.primary,
    borderWidth: 4,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: BorderRadius.lg,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: BorderRadius.lg,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: BorderRadius.lg,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.lg,
  },
  instructionText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
    textAlign: 'center',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 2,
    borderTopColor: Colors.error,
  },
  errorBannerText: {
    marginLeft: Spacing.sm,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.error,
    flex: 1,
  },
  resultContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  statusCard: {
    marginBottom: Spacing.lg,
  },
  statusCardValid: {
    backgroundColor: Colors.successLight,
    borderWidth: 2,
    borderColor: Colors.success,
  },
  statusCardInvalid: {
    backgroundColor: Colors.errorLight,
    borderWidth: 2,
    borderColor: Colors.error,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  detailsCard: {
    marginBottom: Spacing.lg,
  },
  detailsTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  infoLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  itemsTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  itemLeft: {
    flex: 1,
  },
  itemName: {
    fontSize: FontSize.sm,
    color: Colors.text,
    marginBottom: 2,
  },
  itemQty: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  itemPrice: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  totalValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  actionButtons: {
    gap: Spacing.md,
  },
  approveButton: {
    backgroundColor: Colors.success,
  },
  denyButton: {
    backgroundColor: Colors.errorLight,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.error,
  },
  denyButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.error,
  },
  scanNextButton: {
    backgroundColor: Colors.primary,
  },
});
