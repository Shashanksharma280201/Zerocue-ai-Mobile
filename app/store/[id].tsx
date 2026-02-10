import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight } from '../../constants/Colors';
import { STORES, getStoreProducts, getInventoryQty } from '../../lib/dummyData';
import { Product } from '../../lib/types';
import { useBookingStore } from '../../lib/stores/bookingStore';

export default function StoreDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const store = STORES.find(s => s.id === id);
  const products = getStoreProducts(id);

  const {
    currentBooking,
    currentStore,
    setCurrentStore,
    addToBooking,
    removeFromBooking,
    updateBookingQty,
    getBookingTotal,
    createBooking,
  } = useBookingStore();

  // Set current store when component mounts
  useEffect(() => {
    if (store && (!currentStore || currentStore.id !== store.id)) {
      setCurrentStore(store);
    }
  }, [store, currentStore, setCurrentStore]);

  if (!store) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Store not found</Text>
      </SafeAreaView>
    );
  }

  const handleAddToBooking = (product: Product) => {
    addToBooking(product, 1);
  };

  const handleBookNow = () => {
    if (currentBooking.length === 0) {
      Alert.alert('No items', 'Please add items to your booking first');
      return;
    }

    createBooking('user-1'); // Replace with actual user ID
    Alert.alert(
      'Booking Confirmed',
      'Your items have been reserved for 6 hours. Visit the store to collect them.',
      [
        {
          text: 'View Bookings',
          onPress: () => router.push('/(tabs)/bookings'),
        },
        { text: 'OK' },
      ]
    );
  };

  const currentStoreBooking = currentStore?.id === store.id ? currentBooking : [];
  const bookingTotal = getBookingTotal();
  const bookingCount = currentStoreBooking.reduce((sum, item) => sum + item.qty, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {store.name}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Store Info Card */}
        <View style={styles.storeCard}>
          <View style={styles.storeHeader}>
            <View style={styles.storeLogo}>
              {store.brand_logo ? (
                <Text style={styles.storeLogoText}>{store.brand_logo}</Text>
              ) : (
                <Ionicons name="storefront-outline" size={32} color={Colors.primary} />
              )}
            </View>
            <View style={styles.storeHeaderInfo}>
              <Text style={styles.storeName}>{store.name}</Text>
              <Text style={styles.brandName}>{store.brand_name}</Text>
            </View>
            {store.is_open && (
              <View style={styles.openBadge}>
                <View style={styles.openDot} />
                <Text style={styles.openText}>Open</Text>
              </View>
            )}
          </View>

          <View style={styles.storeDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{store.address}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="walk-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>
                {store.distance?.toFixed(1)} km away
              </Text>
              {store.rating && (
                <>
                  <Text style={styles.detailSeparator}>•</Text>
                  <Ionicons name="star" size={16} color={Colors.warning} />
                  <Text style={styles.detailText}>{store.rating.toFixed(1)}</Text>
                </>
              )}
            </View>
            {store.phone && (
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.detailText}>{store.phone}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Available Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Available Products ({products.length})
          </Text>

          {products.map(product => {
            const qty = getInventoryQty(store.id, product.id);
            const bookingItem = currentStoreBooking.find(
              item => item.product.id === product.id
            );

            return (
              <ProductCard
                key={product.id}
                product={product}
                availableQty={qty}
                bookingQty={bookingItem?.qty || 0}
                onAdd={() => handleAddToBooking(product)}
                onIncrease={() => updateBookingQty(product.id, (bookingItem?.qty || 0) + 1)}
                onDecrease={() => {
                  if (bookingItem && bookingItem.qty > 1) {
                    updateBookingQty(product.id, bookingItem.qty - 1);
                  } else {
                    removeFromBooking(product.id);
                  }
                }}
              />
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Booking Footer */}
      {currentStoreBooking.length > 0 && (
        <View style={styles.bookingFooter}>
          <View style={styles.bookingInfo}>
            <Text style={styles.bookingCount}>
              {bookingCount} item{bookingCount !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.bookingTotal}>₹{bookingTotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.bookButton} onPress={handleBookNow}>
            <Text style={styles.bookButtonText}>Book Now →</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function ProductCard({
  product,
  availableQty,
  bookingQty,
  onAdd,
  onIncrease,
  onDecrease,
}: {
  product: Product;
  availableQty: number;
  bookingQty: number;
  onAdd: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
}) {
  const inStock = availableQty > 0;

  return (
    <View style={styles.productCard}>
      <View style={styles.productIcon}>
        {product.image ? (
          <Text style={styles.productIconText}>{product.image}</Text>
        ) : (
          <Ionicons name="cube-outline" size={28} color={Colors.primary} />
        )}
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        {product.description && (
          <Text style={styles.productDescription} numberOfLines={1}>
            {product.description}
          </Text>
        )}
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>₹{product.mrp.toFixed(2)}</Text>
          <Text style={[styles.stockBadge, !inStock && styles.outOfStockBadge]}>
            {inStock ? `${availableQty} in stock` : 'Out of stock'}
          </Text>
        </View>
      </View>

      {bookingQty > 0 ? (
        <View style={styles.quantityControl}>
          <TouchableOpacity style={styles.qtyButton} onPress={onDecrease}>
            <Text style={styles.qtyButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>{bookingQty}</Text>
          <TouchableOpacity
            style={[styles.qtyButton, bookingQty >= availableQty && styles.qtyButtonDisabled]}
            onPress={onIncrease}
            disabled={bookingQty >= availableQty}
          >
            <Text style={styles.qtyButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.addButton, !inStock && styles.addButtonDisabled]}
          onPress={onAdd}
          disabled={!inStock}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
    marginHorizontal: Spacing.md,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  storeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  storeLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  storeLogoText: {
    fontSize: 32,
  },
  storeHeaderInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: 2,
  },
  brandName: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  openText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: FontWeight.semibold,
  },
  storeDetails: {
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  detailSeparator: {
    marginHorizontal: Spacing.xs,
    color: Colors.textLight,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  productIconText: {
    fontSize: 28,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  productDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  productPrice: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  stockBadge: {
    fontSize: FontSize.xs,
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    fontWeight: FontWeight.semibold,
  },
  outOfStockBadge: {
    color: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  addButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: 4,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonDisabled: {
    opacity: 0.4,
  },
  qtyButtonText: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  qtyText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    minWidth: 40,
    textAlign: 'center',
  },
  bookingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  bookingTotal: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  bookButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  bookButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});
