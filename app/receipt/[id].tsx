import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState, useEffect } from 'react';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadows } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { fetchOrderById } from '../../lib/api/orders';

const { width } = Dimensions.get('window');

export default function Receipt() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const receiptId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReceipt() {
      try {
        setLoading(true);
        const data = await fetchOrderById(receiptId);
        setOrder(data);
      } catch (err: any) {
        console.error('Error loading receipt:', err);
        setError(err.message || 'Failed to load receipt');
      } finally {
        setLoading(false);
      }
    }

    if (receiptId) {
      loadReceipt();
    }
  }, [receiptId]);

  if (loading) {
    return (
      <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.container}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.white} />
            <Text style={styles.loadingText}>Loading your receipt...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error || !order) {
    return (
      <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.container}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color={Colors.white} />
            <Text style={styles.errorTitle}>Receipt Not Found</Text>
            <Text style={styles.errorText}>{error || 'Unable to load receipt'}</Text>
            <TouchableOpacity style={styles.errorButton} onPress={() => router.replace('/(tabs)')}>
              <Text style={styles.errorButtonText}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Extract receipt data
  const receipt = order.receipt?.[0];
  if (!receipt) {
    return null;
  }

  // Format receipt data from order
  const orderNumber = order.id.slice(0, 8).toUpperCase();
  const orderDate = new Date(order.created_at).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `ZeroCue Receipt ${orderNumber}\nTotal: ₹${order.total.toLocaleString()}\nDate: ${orderDate}`,
        title: 'Share Receipt',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDone = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Navigate to home tab
    router.replace('/(tabs)');
  };

  return (
    <LinearGradient
      colors={[Colors.primaryLight, Colors.primary]}
      style={styles.container}
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.successBadgeHeader}>
            <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
            <Text style={styles.headerTitle}>Payment Successful</Text>
          </View>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* QR Code Card */}
          <View style={styles.qrCard}>
            <Text style={styles.qrCardTitle}>Show at Exit</Text>
            <Text style={styles.qrCardSubtitle}>Scan this QR code at the exit for verification</Text>

            <View style={styles.qrCodeContainer}>
              <QRCode
                value={receipt.qr_token}
                size={width * 0.5}
                backgroundColor="white"
                color={Colors.text}
              />
            </View>

            <View style={styles.receiptNumberContainer}>
              <Text style={styles.receiptNumberLabel}>Receipt Number</Text>
              <Text style={styles.receiptNumber}>{orderNumber}</Text>
            </View>
          </View>

          {/* Order Details Card */}
          <View style={styles.detailsCard}>
            <Text style={styles.detailsCardTitle}>Order Details</Text>

            {/* Items */}
            <View style={styles.itemsList}>
              {order.cart_items.map((item: any) => (
                <View key={item.id} style={styles.receiptItem}>
                  <View style={styles.receiptItemLeft}>
                    <Text style={styles.receiptItemName}>{item.product.name}</Text>
                    <Text style={styles.receiptItemMeta}>
                      {item.product.attributes?.brand || 'Brand'} • Qty: {item.qty}
                    </Text>
                  </View>
                  <Text style={styles.receiptItemPrice}>
                    ₹{item.subtotal.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>

            {/* Price Breakdown */}
            <View style={styles.priceBreakdown}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Subtotal</Text>
                <Text style={styles.priceValue}>₹{order.subtotal.toLocaleString()}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Tax (GST)</Text>
                <Text style={styles.priceValue}>₹{order.tax.toFixed(2)}</Text>
              </View>
              <View style={styles.priceDivider} />
              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total Paid</Text>
                <Text style={styles.totalValue}>₹{order.total.toLocaleString()}</Text>
              </View>
            </View>

            {/* Payment Info */}
            <View style={styles.paymentInfo}>
              <View style={styles.infoRow}>
                <View style={styles.infoRowLeft}>
                  <Ionicons name="card-outline" size={20} color={Colors.textSecondary} />
                  <Text style={styles.infoLabel}>Payment Method</Text>
                </View>
                <Text style={styles.infoValue}>{order.status === 'paid' ? 'PAID' : order.status.toUpperCase()}</Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoRowLeft}>
                  <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
                  <Text style={styles.infoLabel}>Date & Time</Text>
                </View>
                <Text style={styles.infoValue}>{orderDate}</Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoRowLeft}>
                  <Ionicons name="storefront-outline" size={20} color={Colors.textSecondary} />
                  <Text style={styles.infoLabel}>Store</Text>
                </View>
                <Text style={styles.infoValue}>{order.store?.name || 'Store'}</Text>
              </View>
            </View>
          </View>

          {/* Success Message */}
          <View style={styles.messageCard}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
            <Text style={styles.messageTitle}>Thank you for shopping!</Text>
            <Text style={styles.messageText}>
              Your order has been confirmed. Please show the QR code at the exit for verification.
            </Text>
          </View>
        </ScrollView>

        {/* Done Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDone}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
              style={styles.doneButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="home" size={22} color={Colors.white} />
              <Text style={styles.doneButtonText}>Continue Shopping</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: FontWeight.medium,
    color: Colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginTop: Spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  errorButton: {
    marginTop: Spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  successBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  qrCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.large,
  },
  qrCardTitle: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  qrCardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  qrCodeContainer: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  receiptNumberContainer: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  receiptNumberLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  receiptNumber: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: 1,
  },
  detailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  detailsCardTitle: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  itemsList: {
    marginBottom: Spacing.lg,
  },
  receiptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  receiptItemLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  receiptItemName: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: 4,
  },
  receiptItemMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  receiptItemPrice: {
    fontSize: 14,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  priceBreakdown: {
    paddingTop: Spacing.lg,
    borderTopWidth: 2,
    borderTopColor: Colors.borderLight,
    marginBottom: Spacing.lg,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  priceDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  paymentInfo: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  messageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  messageText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  doneButton: {
    height: 56,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.large,
  },
  doneButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
});
