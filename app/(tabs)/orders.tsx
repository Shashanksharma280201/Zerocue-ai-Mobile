import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadows } from '../../constants/Colors';
import { fetchUserOrders } from '../../lib/api/orders';
import { useAuthStore } from '../../lib/stores/authStore';
import { useCartStore } from '../../lib/stores/cartStore';

// Dummy order data (fallback)
const DUMMY_ORDERS = [
  {
    id: '1',
    orderNumber: 'ORD-2025-0147',
    date: '2025-11-15',
    status: 'delivered',
    items: [
      { name: 'Linen Co-ord Set', brand: 'Zara', quantity: 1 },
      { name: 'Straw Bag', brand: 'Mango', quantity: 1 },
    ],
    total: 3798,
    deliveryDate: '2025-11-17',
  },
  {
    id: '2',
    orderNumber: 'ORD-2025-0138',
    date: '2025-11-12',
    status: 'in_transit',
    items: [
      { name: 'Little Black Dress', brand: 'H&M', quantity: 1 },
      { name: 'Gold Necklace', brand: 'Accessorize', quantity: 1 },
    ],
    total: 4398,
    deliveryDate: '2025-11-18',
  },
  {
    id: '3',
    orderNumber: 'ORD-2025-0129',
    date: '2025-11-08',
    status: 'processing',
    items: [
      { name: 'Oversized Hoodie', brand: 'Forever 21', quantity: 2 },
    ],
    total: 3998,
    deliveryDate: '2025-11-20',
  },
  {
    id: '4',
    orderNumber: 'ORD-2025-0115',
    date: '2025-11-01',
    status: 'cancelled',
    items: [
      { name: 'Blazer Set', brand: 'Zara', quantity: 1 },
    ],
    total: 4999,
    deliveryDate: null,
  },
];

const STATUS_FILTERS = ['All', 'Paid', 'Pending', 'Failed'];
const DATE_FILTERS = ['All Time', 'This Week', 'This Month', 'Last 3 Months'];

// Map order status from database to UI display status
const mapOrderStatus = (dbStatus: string): string => {
  switch (dbStatus) {
    case 'paid':
      return 'paid';
    case 'pending':
    case 'processing':
      return 'pending';
    case 'failed':
    case 'cancelled':
      return 'failed';
    default:
      return dbStatus;
  }
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'paid':
      return {
        label: 'Paid',
        icon: 'checkmark-circle' as const,
        color: Colors.success,
        bgColor: '#ECFDF5',
      };
    case 'pending':
      return {
        label: 'Pending',
        icon: 'time' as const,
        color: Colors.warning,
        bgColor: '#FFFBEB',
      };
    case 'failed':
      return {
        label: 'Failed',
        icon: 'close-circle' as const,
        color: Colors.error,
        bgColor: '#FEF2F2',
      };
    default:
      return {
        label: status,
        icon: 'help-circle' as const,
        color: Colors.textSecondary,
        bgColor: Colors.backgroundSecondary,
      };
  }
};

export default function Orders() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedDateFilter, setSelectedDateFilter] = useState('All Time');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [user]);

  async function loadOrders(isRefreshing = false) {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const userOrders = await fetchUserOrders(user.id);

      // Transform orders to match UI format
      const transformedOrders = userOrders.map((order: any) => ({
        id: order.id,
        orderNumber: order.id.slice(0, 8).toUpperCase(),
        date: order.created_at,
        status: mapOrderStatus(order.status),
        items: order.cart_items.map((item: any) => ({
          name: item.product?.name || 'Unknown Product',
          brand: item.product?.attributes?.brand || 'Brand',
          quantity: item.qty,
          product: item.product, // Keep full product for reordering
        })),
        total: order.total,
        deliveryDate: null, // In-store pickup, no delivery
      }));

      setOrders(transformedOrders);
    } catch (err: any) {
      console.error('Error loading orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }

  const onRefresh = () => {
    loadOrders(true);
  };

  const filterByDate = (order: any) => {
    const orderDate = new Date(order.date);
    const now = new Date();

    switch (selectedDateFilter) {
      case 'This Week': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= weekAgo;
      }
      case 'This Month': {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return orderDate >= monthAgo;
      }
      case 'Last 3 Months': {
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return orderDate >= threeMonthsAgo;
      }
      default:
        return true;
    }
  };

  const filteredOrders = orders.filter(order => {
    // Status filter
    const statusMatch = selectedFilter === 'All' || getStatusConfig(order.status).label === selectedFilter;

    // Date filter
    const dateMatch = filterByDate(order);

    // Search filter
    const searchMatch = searchQuery === '' ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((item: any) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return statusMatch && dateMatch && searchMatch;
  });

  const handleOrderPress = (orderId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to receipt page
    const order = orders.find(o => o.id === orderId);
    if (order) {
      router.push(`/receipt/${order.id}`);
    }
  };

  const handleReorder = (order: any) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      'Reorder Items',
      `Add all ${order.items.length} item(s) from this order to your cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add to Cart',
          onPress: () => {
            order.items.forEach((item: any) => {
              if (item.product) {
                addItem(item.product, item.quantity);
              }
            });
            Alert.alert('Success', 'Items added to your cart!');
          },
        },
      ]
    );
  };

  // Calculate order statistics
  const calculateStats = () => {
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
    const paidOrders = orders.filter(order => order.status === 'paid').length;
    return { totalSpent, totalOrders: orders.length, paidOrders };
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.headerContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Orders</Text>
          </View>
        </SafeAreaView>
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.emptyText, { marginTop: Spacing.md }]}>Loading your orders...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.headerContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Orders</Text>
          </View>
        </SafeAreaView>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="alert-circle-outline" size={80} color={Colors.error} />
          </View>
          <Text style={styles.emptyTitle}>Failed to Load Orders</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={loadOrders}
            activeOpacity={0.8}
          >
            <Text style={styles.shopButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.headerContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Orders</Text>
          </View>
        </SafeAreaView>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="receipt-outline" size={80} color={Colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptyText}>
            Your order history will appear here once you make your first purchase
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/scan-camera')}
            activeOpacity={0.8}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const stats = calculateStats();

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Orders</Text>
          <View style={styles.orderCount}>
            <Text style={styles.orderCountText}>{orders.length}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by order number or product..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Summary */}
        {orders.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₹{stats.totalSpent.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.paidOrders}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalOrders}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
          </View>
        )}

        {/* Status Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
          style={styles.filtersContainer}
        >
          {STATUS_FILTERS.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill,
                selectedFilter === filter && styles.filterPillActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedFilter(filter);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter && styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Date Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
          style={[styles.filtersContainer, { marginTop: Spacing.xs }]}
        >
          {DATE_FILTERS.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.dateFilterPill,
                selectedDateFilter === filter && styles.dateFilterPillActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedDateFilter(filter);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="calendar-outline"
                size={14}
                color={selectedDateFilter === filter ? Colors.white : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.dateFilterText,
                  selectedDateFilter === filter && styles.dateFilterTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* Orders List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.noResults}>
            <Ionicons name="search-outline" size={64} color={Colors.textLight} />
            <Text style={styles.noResultsText}>
              {searchQuery || selectedFilter !== 'All' || selectedDateFilter !== 'All Time'
                ? 'No orders match your filters'
                : 'No orders in this category'}
            </Text>
          </View>
        ) : (
          filteredOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onPress={() => handleOrderPress(order.id)}
              onReorder={() => handleReorder(order)}
            />
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

interface OrderCardProps {
  order: typeof DUMMY_ORDERS[0];
  onPress: () => void;
  onReorder: () => void;
}

function OrderCard({ order, onPress, onReorder }: OrderCardProps) {
  const statusConfig = getStatusConfig(order.status);

  return (
    <View style={styles.orderCardContainer}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.orderCardOuter}>
          <View style={styles.orderCardInner}>
          {/* Header Section */}
          <View style={styles.orderHeaderSection}>
            <View style={styles.orderMetaRow}>
              <View>
                <Text style={styles.orderLabel}>ORDER</Text>
                <Text style={styles.orderNumber}>{order.orderNumber}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}>
                <Ionicons name={statusConfig.icon} size={16} color={statusConfig.color} />
                <Text style={[styles.statusText, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </View>
            </View>

            <Text style={styles.orderDate}>
              {new Date(order.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>

          {/* Items Section */}
          <View style={styles.itemsSection}>
            {order.items.map((item, index) => (
              <View key={index} style={styles.orderItemRow}>
                <View style={styles.itemIconWrapper}>
                  <Ionicons name="shirt-outline" size={24} color={Colors.text} opacity={0.5} />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemBrand}>{item.brand}</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                <View style={styles.quantityBadge}>
                  <Text style={styles.quantityText}>x{item.quantity}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Footer Section */}
          <View style={styles.orderFooterSection}>
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{order.total.toLocaleString()}</Text>
            </View>

            {order.deliveryDate && order.status !== 'cancelled' && (
              <View style={styles.deliveryBadge}>
                <Ionicons name="calendar" size={14} color={Colors.textSecondary} />
                <Text style={styles.deliveryText}>
                  {order.status === 'delivered' ? 'Delivered' : 'Expected'}{' '}
                  {new Date(order.deliveryDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            )}
          </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Reorder Button */}
      <TouchableOpacity
        style={styles.reorderButton}
        onPress={(e) => {
          e.stopPropagation();
          onReorder();
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="reload" size={18} color={Colors.white} />
        <Text style={styles.reorderButtonText}>Reorder</Text>
      </TouchableOpacity>
    </View>
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
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  orderCount: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  orderCountText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    paddingVertical: Spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  filtersContainer: {
    marginTop: Spacing.md,
  },
  filtersScroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSecondary,
    marginRight: Spacing.sm,
  },
  filterPillActive: {
    backgroundColor: Colors.text,
  },
  filterText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  dateFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSecondary,
    marginRight: Spacing.sm,
  },
  dateFilterPillActive: {
    backgroundColor: Colors.text,
  },
  dateFilterText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  dateFilterTextActive: {
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  // Magazine-style order card with solid colors
  orderCardContainer: {
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  orderCardOuter: {
    backgroundColor: Colors.fashion.ocean,
    padding: 3,
    borderRadius: BorderRadius.xl,
    ...Shadows.medium,
  },
  orderCardInner: {
    backgroundColor: Colors.fashion.cream,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl - 3,
    overflow: 'hidden',
  },
  reorderButton: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.text,
    paddingHorizontal: Spacing.md + 4,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    ...Shadows.medium,
  },
  reorderButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  orderHeaderSection: {
    marginBottom: Spacing.lg,
  },
  orderMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  orderLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  orderDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  itemsSection: {
    gap: Spacing.sm + 4,
    marginBottom: Spacing.lg,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  itemIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemBrand: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  itemName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  quantityBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  quantityText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  orderFooterSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.lg,
    alignSelf: 'flex-start',
  },
  deliveryText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  noResultsText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  shopButton: {
    backgroundColor: Colors.text,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.xl,
    ...Shadows.medium,
  },
  shopButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
});
