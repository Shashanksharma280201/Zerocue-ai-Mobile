import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadows } from '../constants/Colors';
import { useCartStore } from '../lib/stores/cartStore';
import { createOrder } from '../lib/api/orders';
import { useAuthStore } from '../lib/stores/authStore';
import { initiateRazorpayPayment } from '../lib/services/razorpay';

type PaymentMethod = 'upi' | 'card' | 'cash';

export default function Checkout() {
  const router = useRouter();
  const { items, getSubtotal, getTotalTax, getTotal, clearCart } = useCartStore();
  const { user, currentStore } = useAuthStore();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('upi');
  const [processing, setProcessing] = useState(false);

  // Calculate totals
  const subtotal = getSubtotal();
  const tax = getTotalTax();
  const total = getTotal();

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPaymentMethod(method);
  };

  const handleProcessPayment = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty. Please add items before checkout.');
      return;
    }

    if (!user || !user.id) {
      Alert.alert('Authentication Required', 'Please log in to complete your purchase.');
      router.push('/(auth)/phone');
      return;
    }

    if (!currentStore) {
      Alert.alert(
        'Store Not Selected',
        'Please select your store before checkout.',
        [
          {
            text: 'Select Store',
            onPress: () => router.push('/store-selection'),
          },
        ]
      );
      return;
    }

    setProcessing(true);

    try {
      const storeId = currentStore.id;
      let paymentId: string | undefined;
      let paymentRef: string | undefined;

      // Prepare order items
      const orderItems = items.map(item => ({
        productId: item.product.id,
        quantity: item.qty,
        price: item.product.mrp,
        taxRate: item.product.tax_rate || 0,
      }));

      // Handle payment based on method
      if (selectedPaymentMethod === 'upi' || selectedPaymentMethod === 'card') {
        try {
          // Initiate Razorpay payment
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

          const amountInPaise = Math.round(total * 100); // Convert to paise
          const orderId = `order_${Date.now()}_${user.id.substring(0, 8)}`;

          const paymentResponse = await initiateRazorpayPayment({
            orderId,
            amount: amountInPaise,
            name: currentStore.name || 'ZeroCue Store',
            description: `Payment for ${items.length} items`,
            customerName: user.name || user.phone || 'Customer',
            customerEmail: user.email,
            customerContact: user.phone,
          });

          paymentId = paymentResponse.razorpay_payment_id;
          paymentRef = paymentResponse.razorpay_order_id;

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (paymentError: any) {
          console.error('Razorpay payment error:', paymentError);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

          Alert.alert(
            'Payment Failed',
            paymentError.message || 'Could not process payment. Please try again.',
            [{ text: 'OK' }]
          );
          setProcessing(false);
          return; // Don't create order if payment failed
        }
      } else {
        // Cash on delivery - no payment required
        paymentRef = `CASH-${Date.now()}`;
      }

      // Create order in Supabase after successful payment
      const result = await createOrder({
        userId: user.id,
        storeId,
        items: orderItems,
        paymentMethod: selectedPaymentMethod,
        paymentRef: paymentRef || `ORDER-${Date.now()}`,
        paymentId,
      });

      if (result.success) {
        // Clear cart after successful order
        clearCart();

        // Navigate to receipt page
        router.replace(`/receipt/${result.receiptId}`);

        // Show success feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error('Order creation failed');
      }
    } catch (error: any) {
      console.error('Order creation error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Alert.alert(
        'Order Failed',
        error.message || 'There was an error creating your order. Please contact support.',
        [{ text: 'OK' }]
      );
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.backButton} />
        </SafeAreaView>

        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>No items to checkout</Text>
          <Text style={styles.emptyText}>Add items to your cart to continue</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.shopButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
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
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.backButton} />
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.orderSummaryCard}>
            {items.map((item) => (
              <View key={item.product.id} style={styles.orderItem}>
                <View style={styles.orderItemInfo}>
                  <Text style={styles.orderItemName} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.orderItemMeta}>
                    {item.product.attributes?.brand || 'Brand'} • Qty: {item.qty}
                  </Text>
                </View>
                <Text style={styles.orderItemPrice}>
                  ₹{(item.product.mrp * item.qty).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          {/* UPI */}
          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              selectedPaymentMethod === 'upi' && styles.paymentMethodCardSelected,
            ]}
            onPress={() => handlePaymentMethodSelect('upi')}
            activeOpacity={0.7}
          >
            <View style={styles.paymentMethodLeft}>
              <View style={[
                styles.paymentMethodIconContainer,
                selectedPaymentMethod === 'upi' && styles.paymentMethodIconContainerSelected,
              ]}>
                <Ionicons
                  name="logo-google"
                  size={24}
                  color={selectedPaymentMethod === 'upi' ? Colors.primary : Colors.textSecondary}
                />
              </View>
              <View>
                <Text style={styles.paymentMethodTitle}>UPI</Text>
                <Text style={styles.paymentMethodSubtitle}>Google Pay, PhonePe, Paytm</Text>
              </View>
            </View>
            <View style={[
              styles.radioButton,
              selectedPaymentMethod === 'upi' && styles.radioButtonSelected,
            ]}>
              {selectedPaymentMethod === 'upi' && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>

          {/* Card */}
          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              selectedPaymentMethod === 'card' && styles.paymentMethodCardSelected,
            ]}
            onPress={() => handlePaymentMethodSelect('card')}
            activeOpacity={0.7}
          >
            <View style={styles.paymentMethodLeft}>
              <View style={[
                styles.paymentMethodIconContainer,
                selectedPaymentMethod === 'card' && styles.paymentMethodIconContainerSelected,
              ]}>
                <Ionicons
                  name="card"
                  size={24}
                  color={selectedPaymentMethod === 'card' ? Colors.primary : Colors.textSecondary}
                />
              </View>
              <View>
                <Text style={styles.paymentMethodTitle}>Credit/Debit Card</Text>
                <Text style={styles.paymentMethodSubtitle}>Visa, Mastercard, RuPay</Text>
              </View>
            </View>
            <View style={[
              styles.radioButton,
              selectedPaymentMethod === 'card' && styles.radioButtonSelected,
            ]}>
              {selectedPaymentMethod === 'card' && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>

          {/* Cash */}
          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              selectedPaymentMethod === 'cash' && styles.paymentMethodCardSelected,
            ]}
            onPress={() => handlePaymentMethodSelect('cash')}
            activeOpacity={0.7}
          >
            <View style={styles.paymentMethodLeft}>
              <View style={[
                styles.paymentMethodIconContainer,
                selectedPaymentMethod === 'cash' && styles.paymentMethodIconContainerSelected,
              ]}>
                <Ionicons
                  name="cash"
                  size={24}
                  color={selectedPaymentMethod === 'cash' ? Colors.primary : Colors.textSecondary}
                />
              </View>
              <View>
                <Text style={styles.paymentMethodTitle}>Cash on Delivery</Text>
                <Text style={styles.paymentMethodSubtitle}>Pay at store exit</Text>
              </View>
            </View>
            <View style={[
              styles.radioButton,
              selectedPaymentMethod === 'cash' && styles.radioButtonSelected,
            ]}>
              {selectedPaymentMethod === 'cash' && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>
          <View style={styles.priceOuter}>
            <View style={styles.priceInner}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Subtotal</Text>
                <Text style={styles.priceValue}>₹{subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Tax (GST)</Text>
                <Text style={styles.priceValue}>₹{tax.toFixed(2)}</Text>
              </View>
              <View style={styles.priceDivider} />
              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Payment Button */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerTotal}>
            <Text style={styles.footerTotalLabel}>Total to Pay</Text>
            <Text style={styles.footerTotalValue}>₹{total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.payButton, processing && styles.payButtonDisabled]}
            onPress={handleProcessPayment}
            disabled={processing}
            activeOpacity={0.9}
          >
            <View style={styles.payButtonOuter}>
              <View style={[
                styles.payButtonInner,
                processing && styles.payButtonInnerProcessing
              ]}>
                {processing ? (
                  <>
                    <ActivityIndicator color={Colors.white} />
                    <Text style={styles.payButtonText}>Processing...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={20} color={Colors.white} />
                    <Text style={styles.payButtonText}>Pay Securely</Text>
                  </>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
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
    borderBottomColor: Colors.border,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
    letterSpacing: -0.2,
  },
  orderSummaryCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  orderItemInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  orderItemMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  paymentMethodCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  paymentMethodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodIconContainerSelected: {
    backgroundColor: 'rgba(115, 115, 102, 0.15)',
  },
  paymentMethodTitle: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  paymentMethodSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  priceOuter: {
    backgroundColor: Colors.fashion.ocean,
    padding: 3,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  priceInner: {
    backgroundColor: Colors.fashion.azure,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg - 3,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: FontWeight.normal,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  priceDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
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
    letterSpacing: -0.3,
  },
  footer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.large,
  },
  footerContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  footerTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  footerTotalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  footerTotalValue: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  payButton: {
    height: 56,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonOuter: {
    flex: 1,
    backgroundColor: Colors.fashion.ocean,
    padding: 3,
  },
  payButtonInner: {
    flex: 1,
    backgroundColor: Colors.fashion.azure,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.xl - 3,
  },
  payButtonInnerProcessing: {
    backgroundColor: Colors.textLight,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  shopButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
});
