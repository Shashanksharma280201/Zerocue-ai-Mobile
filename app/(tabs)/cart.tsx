import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadows } from '../../constants/Colors';
import { useCartStore } from '../../lib/stores/cartStore';

const { width, height } = Dimensions.get('window');

// Dummy cart items
const INITIAL_CART_ITEMS = [
  {
    id: '1',
    name: 'Linen Co-ord Set',
    brand: 'Zara',
    price: 2499,
    originalPrice: 3999,
    size: 'M',
    color: 'Beige',
    quantity: 1,
    image: null,
  },
  {
    id: '2',
    name: 'White Sneakers',
    brand: 'Nike',
    price: 2999,
    originalPrice: null,
    size: '9',
    color: 'White',
    quantity: 1,
    image: null,
  },
  {
    id: '3',
    name: 'Gold Necklace',
    brand: 'Accessorize',
    price: 899,
    originalPrice: null,
    size: 'One Size',
    color: 'Gold',
    quantity: 2,
    image: null,
  },
];

export default function Cart() {
  const router = useRouter();
  const { items: storeItems, updateQuantity: storeUpdateQuantity, removeItem: storeRemoveItem, getSubtotal, getTotalTax, getTotal, getItemCount } = useCartStore();
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Convert store items to display format
  const cartItems = storeItems.map(item => ({
    id: item.product.id,
    name: item.product.name,
    brand: item.product.attributes?.brand || 'Brand',
    price: item.product.mrp,
    originalPrice: null,
    size: item.product.attributes?.size || 'N/A',
    color: item.product.attributes?.color || 'N/A',
    quantity: item.qty,
    image: null,
  }));

  const updateQuantity = (id: string, newQuantity: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (newQuantity < 1) return;

    storeUpdateQuantity(id, newQuantity);

    // Update selected item if it's currently open
    if (selectedItem && selectedItem.id === id) {
      const updatedItem = cartItems.find(item => item.id === id);
      if (updatedItem) {
        setSelectedItem({ ...updatedItem, quantity: newQuantity });
      }
    }
  };

  const removeItem = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    storeRemoveItem(id);
    setSelectedItem(null);
  };

  const handleRemove = (id: string, name: string) => {
    Alert.alert(
      'Remove Item',
      `Remove ${name} from cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeItem(id),
        },
      ]
    );
  };

  const handleItemPress = (item: typeof INITIAL_CART_ITEMS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedItem(item);
  };

  const handleCheckout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/checkout');
  };

  // Calculate totals from store
  const subtotal = getSubtotal();
  const tax = getTotalTax();
  const total = getTotal();
  const savings = 0; // No savings calculation for now

  if (cartItems.length === 0) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.headerContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Bag</Text>
          </View>
        </SafeAreaView>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="bag-outline" size={60} color={Colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>Your bag is empty</Text>
          <Text style={styles.emptyText}>
            Browse our collection and add items to get started
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => {}}
            activeOpacity={0.8}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Bag</Text>
          <View style={styles.itemCount}>
            <Text style={styles.itemCountText}>
              {getItemCount()} items
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Cart Items with Inline Controls */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {cartItems.map(item => (
          <CartItemCard
            key={item.id}
            item={item}
            onPress={() => handleItemPress(item)}
            onUpdateQuantity={updateQuantity}
            onRemove={handleRemove}
          />
        ))}

        {/* Price Breakdown - Magazine Style */}
        <View style={styles.summarySection}>
          <View style={styles.summaryOuter}>
            <View style={styles.summaryInner}>
              <Text style={styles.summaryTitle}>Order Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax (GST)</Text>
                <Text style={styles.summaryValue}>₹{tax.toFixed(2)}</Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Checkout Footer */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerTotal}>
            <Text style={styles.footerTotalLabel}>Total</Text>
            <Text style={styles.footerTotalValue}>₹{total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleCheckout}
            activeOpacity={0.8}
          >
            <Text style={styles.checkoutButtonText}>Checkout</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Full-Screen Product Detail Drawer */}
      {selectedItem && (
        <ProductDetailDrawer
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdateQuantity={updateQuantity}
          onRemove={handleRemove}
        />
      )}
    </View>
  );
}

// Cart Item Card with inline controls
interface CartItemCardProps {
  item: typeof INITIAL_CART_ITEMS[0];
  onPress: () => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string, name: string) => void;
}

function CartItemCard({ item, onPress, onUpdateQuantity, onRemove }: CartItemCardProps) {
  return (
    <View style={styles.cartItemCard}>
      {/* Left: Image + Info (tappable for full details) */}
      <TouchableOpacity
        style={styles.cardMainContent}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.cardImagePlaceholder}>
          <Ionicons name="shirt-outline" size={32} color={Colors.textLight} />
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardBrand}>{item.brand}</Text>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardMeta}>
            {item.size} • {item.color}
          </Text>
          <Text style={styles.cardPrice}>₹{item.price.toLocaleString()}</Text>
        </View>
      </TouchableOpacity>

      {/* Right: Inline quantity controls + remove */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.removeIconButton}
          onPress={() => onRemove(item.id, item.name)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.error} />
        </TouchableOpacity>

        <View style={styles.quantityControlsInline}>
          <TouchableOpacity
            style={[
              styles.quantityButtonInline,
              item.quantity <= 1 && styles.quantityButtonDisabled
            ]}
            onPress={() => onUpdateQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
            activeOpacity={0.7}
          >
            <Ionicons
              name="remove"
              size={16}
              color={item.quantity <= 1 ? Colors.textLight : Colors.text}
            />
          </TouchableOpacity>

          <Text style={styles.quantityValueInline}>{item.quantity}</Text>

          <TouchableOpacity
            style={styles.quantityButtonInline}
            onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Full-Screen Product Detail Drawer with Color-Synced Background
interface ProductDetailDrawerProps {
  item: typeof INITIAL_CART_ITEMS[0];
  onClose: () => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string, name: string) => void;
}

function ProductDetailDrawer({ item, onClose, onUpdateQuantity, onRemove }: ProductDetailDrawerProps) {
  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.drawerBackground}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.drawerContainer}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <TouchableOpacity
              style={styles.drawerCloseButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-down" size={28} color={Colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerDeleteButton}
              onPress={() => onRemove(item.id, item.name)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={24} color={Colors.error} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.drawerScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.drawerContent}
          >
            {/* Large Product Image */}
            <View style={styles.drawerImage}>
              <View style={styles.drawerImagePlaceholder}>
                <Ionicons name="shirt-outline" size={120} color={Colors.text} opacity={0.2} />
              </View>
            </View>

            {/* Product Info */}
            <View style={styles.drawerInfo}>
              <Text style={styles.drawerBrand}>{item.brand}</Text>
              <Text style={styles.drawerName}>{item.name}</Text>

              {/* Price Section */}
              <View style={styles.drawerPriceSection}>
                <Text style={styles.drawerPrice}>₹{item.price.toLocaleString()}</Text>
                {item.originalPrice && (
                  <>
                    <Text style={styles.drawerOriginalPrice}>
                      ₹{item.originalPrice.toLocaleString()}
                    </Text>
                    <View style={styles.drawerDiscountBadge}>
                      <Text style={styles.drawerDiscountText}>
                        {Math.round((1 - item.price / item.originalPrice) * 100)}% OFF
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {/* Details Grid */}
              <View style={styles.drawerDetailsGrid}>
                <View style={styles.drawerDetailCard}>
                  <Ionicons name="resize-outline" size={24} color={Colors.text} />
                  <Text style={styles.drawerDetailLabel}>Size</Text>
                  <Text style={styles.drawerDetailValue}>{item.size}</Text>
                </View>
              </View>

              {/* Quantity Section */}
              <View style={styles.drawerQuantitySection}>
                <Text style={styles.drawerSectionTitle}>Quantity</Text>
                <View style={styles.drawerQuantityControls}>
                  <TouchableOpacity
                    style={[
                      styles.drawerQuantityButton,
                      item.quantity <= 1 && styles.drawerQuantityButtonDisabled
                    ]}
                    onPress={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="remove"
                      size={24}
                      color={item.quantity <= 1 ? Colors.textLight : Colors.text}
                    />
                  </TouchableOpacity>

                  <Text style={styles.drawerQuantityValue}>{item.quantity}</Text>

                  <TouchableOpacity
                    style={styles.drawerQuantityButton}
                    onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={24} color={Colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Total */}
              <View style={styles.drawerTotalSection}>
                <Text style={styles.drawerTotalLabel}>Item Total</Text>
                <Text style={styles.drawerTotalValue}>
                  ₹{(item.price * item.quantity).toLocaleString()}
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  headerContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  itemCount: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  // Cart Item Card with Inline Controls
  cartItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  cardMainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardBrand: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardName: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  cardMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: FontWeight.normal,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: 2,
  },
  cardActions: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  removeIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityControlsInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.full,
    padding: 4,
    gap: 8,
  },
  quantityButtonInline: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
  },
  quantityValueInline: {
    fontSize: 14,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  // Full-Screen Product Detail Drawer
  drawerBackground: {
    flex: 1,
    backgroundColor: Colors.fashion.cream,
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
  drawerCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerDeleteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerScroll: {
    flex: 1,
  },
  drawerContent: {
    padding: Spacing.xl,
  },
  drawerImage: {
    width: width - (Spacing.xl * 2),
    height: width - (Spacing.xl * 2),
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: Spacing.xl,
  },
  drawerImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerInfo: {
    gap: Spacing.lg,
  },
  drawerBrand: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  drawerName: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  drawerPriceSection: {
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
  drawerOriginalPrice: {
    fontSize: 16,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  drawerDiscountBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.lg,
  },
  drawerDiscountText: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
    letterSpacing: 0,
  },
  drawerDetailsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  drawerDetailCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  drawerDetailLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: FontWeight.medium,
  },
  drawerDetailValue: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  drawerQuantitySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  drawerSectionTitle: {
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },
  drawerQuantityButtonDisabled: {
    opacity: 0.5,
  },
  drawerQuantityValue: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    minWidth: 60,
    textAlign: 'center',
  },
  drawerTotalSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawerTotalLabel: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  drawerTotalValue: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  // Summary Section
  summarySection: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  summaryOuter: {
    backgroundColor: Colors.fashion.ocean,
    padding: 3,
    borderRadius: BorderRadius.xl,
  },
  summaryInner: {
    backgroundColor: Colors.fashion.azure,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl - 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -0.2,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: FontWeight.normal,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savingsLabel: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: FontWeight.medium,
  },
  savingsValue: {
    fontSize: 14,
    fontWeight: FontWeight.bold,
    color: Colors.success,
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  freeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.success,
    letterSpacing: 0.5,
  },
  freeDeliveryHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: Spacing.sm + 4,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xs,
  },
  freeDeliveryHint: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: FontWeight.medium,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: Spacing.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: 0,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  footerTotal: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  footerTotalValue: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  checkoutButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.medium,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  shopButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.xl,
    ...Shadows.medium,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
});
