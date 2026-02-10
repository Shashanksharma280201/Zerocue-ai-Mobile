import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import ProductDetailDrawer, { Product } from '../../components/ProductDetailDrawer';
import { useReservationStore } from '../../lib/stores/reservationStore';
import { useCartStore } from '../../lib/stores/cartStore';
import { useRouter } from 'expo-router';
import { mockProducts } from '../../lib/data/mockProducts';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - (Spacing.lg * 3)) / 2;

// Product catalog for discovery - using mock data
const DISCOVER_PRODUCTS: Record<string, Product> = mockProducts.reduce((acc, product) => {
  acc[product.id] = {
    id: product.id,
    name: product.name,
    brand: product.attributes?.brand || 'Brand',
    price: product.mrp,
    color: product.attributes?.color || 'Default',
    description: product.description || `Premium ${product.name}`,
    sizes: product.attributes?.sizes || ['S', 'M', 'L', 'XL'],
    colors: product.attributes?.colors || [product.attributes?.color || 'Default'],
    inStock: true,
  };
  return acc;
}, {} as Record<string, Product>);

// Unique discovery categories
const STYLE_CATEGORIES = [
  { id: '1', name: 'Minimalist', color: Colors.backgroundSecondary, icon: 'square-outline' },
  { id: '2', name: 'Bohemian', color: Colors.cream[200], icon: 'flower-outline' },
  { id: '3', name: 'Classic', color: Colors.primaryLight, icon: 'diamond-outline' },
  { id: '4', name: 'Street', color: Colors.secondaryLight, icon: 'bicycle-outline' },
];

const COLLECTIONS = [
  {
    id: '1',
    title: 'Essentials',
    count: 24,
    theme: 'Wardrobe Basics',
    image: mockProducts[5]?.image, // White T-Shirt
  },
  {
    id: '2',
    title: 'Statement',
    count: 18,
    theme: 'Bold Pieces',
    image: mockProducts[1]?.image, // Black Leather Jacket
  },
  {
    id: '3',
    title: 'Vintage',
    count: 32,
    theme: 'Timeless Finds',
    image: mockProducts[4]?.image, // Blue Denim Jeans
  },
];

// Staggered masonry items with product IDs - using real products
const DISCOVERY_ITEMS = mockProducts.slice(0, 6).map((product, index) => ({
  id: product.id,
  name: product.name,
  brand: product.attributes?.brand || 'Brand',
  price: product.mrp,
  image: product.image || product.media?.[0],
  tall: index % 3 === 0, // Every 3rd item is tall
}));

export default function Discover() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { addReservation } = useReservationStore();
  const { addItem, getItemCount } = useCartStore();

  const handleFilter = (filter: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
  };

  const handleProductPress = (productId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const product = DISCOVER_PRODUCTS[productId];
    if (product) {
      setSelectedProduct(product);
      setDrawerVisible(true);
    }
  };

  const handleCloseDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDrawerVisible(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  const handleAddToCart = (product: Product, size: string, color: string) => {
    // Convert product to cart format with all required fields
    const cartProduct = {
      id: product.id,
      tenant_id: 'default-tenant',
      sku: `SKU-${product.id}`,
      barcode: product.id,
      name: product.name,
      mrp: product.price,
      tax_rate: 5, // 5% GST
      category: 'Fashion',
      attributes: { size, color },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addItem(cartProduct, 1); // Add 1 item
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleCloseDrawer();

    // Show success message
    setTimeout(() => {
      Alert.alert(
        '✓ Added to Cart',
        `${product.name} (${size}, ${color}) is in your cart`,
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

  const handleReserve = (product: Product, size: string, color: string) => {
    addReservation({
      productId: product.id,
      productName: product.name,
      brand: product.brand,
      price: product.price,
      size,
      color,
    });

    Alert.alert(
      'Item Reserved!',
      `${product.name} (${size}, ${color}) has been reserved for you. You have 24 hours to visit the store.\n\nView your reservations in Profile → My Reservations.`,
      [{ text: 'OK', onPress: handleCloseDrawer }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Unique Header with Search */}
      <SafeAreaView edges={['top']} style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search styles, brands, items..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.textLight}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Style Categories - Horizontal */}
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {STYLE_CATEGORIES.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[styles.styleCard, { backgroundColor: category.color }]}
                onPress={() => handleFilter(category.name)}
                activeOpacity={0.9}
              >
                <Ionicons name={category.icon as any} size={32} color={Colors.text} />
                <Text style={styles.styleName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Collections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collections</Text>
          <View style={styles.collectionsGrid}>
            {COLLECTIONS.map(collection => (
              <TouchableOpacity
                key={collection.id}
                style={styles.collectionCard}
                activeOpacity={0.9}
              >
                {collection.image && (
                  <Image
                    source={{ uri: collection.image }}
                    style={styles.collectionImage}
                    resizeMode="cover"
                  />
                )}
                <LinearGradient
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
                  style={styles.collectionGradient}
                >
                  <View style={styles.collectionContent}>
                    <View style={styles.collectionBadge}>
                      <Text style={styles.collectionCount}>{collection.count} items</Text>
                    </View>
                    <View style={styles.collectionInfo}>
                      <Text style={styles.collectionTitle}>{collection.title}</Text>
                      <Text style={styles.collectionTheme}>{collection.theme}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Masonry Grid Layout */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>For You</Text>
            <TouchableOpacity>
              <Ionicons name="sync-outline" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.masonryContainer}>
            <View style={styles.masonryColumn}>
              {DISCOVERY_ITEMS.filter((_, i) => i % 2 === 0).map(item => (
                <MasonryItem key={item.id} item={item} onPress={() => handleProductPress(item.id)} />
              ))}
            </View>
            <View style={styles.masonryColumn}>
              {DISCOVERY_ITEMS.filter((_, i) => i % 2 === 1).map(item => (
                <MasonryItem key={item.id} item={item} onPress={() => handleProductPress(item.id)} />
              ))}
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Product Detail Drawer */}
      <ProductDetailDrawer
        visible={drawerVisible}
        product={selectedProduct}
        onClose={handleCloseDrawer}
        onAddToCart={handleAddToCart}
        onReserve={handleReserve}
      />
    </View>
  );
}

interface MasonryItemProps {
  item: typeof DISCOVERY_ITEMS[0];
  onPress: () => void;
}

function MasonryItem({ item, onPress }: MasonryItemProps) {
  const [saved, setSaved] = useState(false);

  const handleSave = (e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaved(!saved);
  };

  return (
    <TouchableOpacity
      style={styles.masonryItem}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={[
        styles.masonryImageContainer,
        { height: item.tall ? 240 : 180 }
      ]}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.masonryImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.masonryImage, { backgroundColor: Colors.backgroundSecondary }]} />
        )}
        <TouchableOpacity
          style={styles.masonrySaveButton}
          onPress={handleSave}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={Colors.text}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.masonryInfo}>
        <Text style={styles.masonryBrand}>{item.brand}</Text>
        <Text style={styles.masonryName}>{item.name}</Text>
        <Text style={styles.masonryPrice}>₹{item.price.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
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
    borderBottomColor: Colors.borderLight,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 4,
    gap: Spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    padding: 0,
    fontWeight: FontWeight.normal,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.lg,
  },
  categoriesSection: {
    marginBottom: Spacing.xl,
  },
  categoriesScroll: {
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  styleCard: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  styleName: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    letterSpacing: 0,
  },
  section: {
    marginBottom: Spacing.xl + Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  },
  collectionsGrid: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  collectionCard: {
    height: 120,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundSecondary,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  collectionImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  collectionGradient: {
    flex: 1,
    padding: Spacing.lg,
  },
  collectionContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  collectionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  collectionCount: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    letterSpacing: 0,
  },
  collectionInfo: {
    gap: 4,
  },
  collectionTitle: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  collectionTheme: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: FontWeight.normal,
  },
  masonryContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  masonryColumn: {
    flex: 1,
    gap: Spacing.md,
  },
  masonryItem: {
    marginBottom: Spacing.sm,
  },
  masonryImageContainer: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  masonryImage: {
    width: '100%',
    height: '100%',
  },
  masonrySaveButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
  },
  masonryInfo: {
    gap: 4,
  },
  masonryBrand: {
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: FontWeight.semibold,
  },
  masonryName: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  masonryPrice: {
    fontSize: 15,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: 2,
  },
});
