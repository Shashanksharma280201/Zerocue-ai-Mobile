import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadows } from '../constants/Colors';
import { fetchStores } from '../lib/api/stores';
import { useAuthStore } from '../lib/stores/authStore';

interface Store {
  id: string;
  name: string;
  address?: string;
  geo?: { lat: number; lng: number };
  open_hours?: any;
}

export default function StoreSelection() {
  const router = useRouter();
  const { setCurrentStore, currentStore } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStores();
  }, []);

  async function loadStores() {
    try {
      setLoading(true);
      console.log('Loading stores...');

      // Fetch stores from API
      const storesData = await fetchStores();
      console.log(`Fetched ${storesData.length} stores`);

      setStores(storesData);
    } catch (err: any) {
      console.error('Error loading stores:', err);
      setError(err.message || 'Failed to load stores');
    } finally {
      setLoading(false);
      console.log('Finished loading stores');
    }
  }

  const handleStoreSelect = (store: any) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCurrentStore(store);

    Alert.alert(
      'Store Selected',
      `You've checked in to ${store.name}.\n\nYou can now start shopping!`,
      [
        {
          text: 'Start Shopping',
          onPress: () => router.replace('/(tabs)'),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.fashion.ocean} />
            <Text style={styles.loadingText}>Loading stores...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color={Colors.error} />
            <Text style={styles.errorTitle}>Unable to Load Stores</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadStores}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="storefront" size={32} color={Colors.white} />
            <Text style={styles.headerTitle}>Select Your Store</Text>
            <Text style={styles.headerSubtitle}>
              Check in to start your seamless shopping experience
            </Text>
          </View>
        </View>

        {/* Current Store Banner */}
        {currentStore && (
          <View style={styles.currentStoreBanner}>
            <View style={styles.currentStoreContent}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.currentStoreText}>
                Currently at: <Text style={styles.currentStoreName}>{currentStore.name}</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
              <Ionicons name="arrow-forward" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
        )}

        {/* Stores List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {stores.map((store) => (
            <TouchableOpacity
              key={store.id}
              style={[
                styles.storeCard,
                currentStore?.id === store.id && styles.storeCardActive,
              ]}
              onPress={() => handleStoreSelect(store)}
              activeOpacity={0.8}
            >
              <View style={styles.storeCardContent}>
                <View style={styles.storeIcon}>
                  <Ionicons
                    name="storefront-outline"
                    size={32}
                    color={currentStore?.id === store.id ? Colors.primary : Colors.text}
                  />
                </View>

                <View style={styles.storeInfo}>
                  <Text style={styles.storeName}>{store.name}</Text>
                  {store.address && (
                    <View style={styles.storeAddress}>
                      <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.storeAddressText} numberOfLines={2}>
                        {store.address}
                      </Text>
                    </View>
                  )}

                  {/* Store metadata removed */}
                </View>

                <View style={styles.storeAction}>
                  {currentStore?.id === store.id ? (
                    <View style={styles.activeIndicator}>
                      <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={24} color={Colors.textLight} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Help Footer */}
        <View style={styles.footer}>
          <View style={styles.helpCard}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.text} />
            <Text style={styles.helpText}>
              Select the store you're visiting to see available products and start shopping
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.fashion.cream,
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
    color: Colors.text,
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
    color: Colors.text,
    marginTop: Spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.fashion.ocean,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.fashion.ocean,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  headerContent: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginTop: Spacing.sm,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.95,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  currentStoreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  currentStoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  currentStoreText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  currentStoreName: {
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  storeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  storeCardActive: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.success,
  },
  storeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  storeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  storeInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  storeName: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  storeAddress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  storeAddressText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  storeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  storeDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  storeDistanceText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  storeStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  storeStatusOpen: {
    backgroundColor: Colors.successLight || '#E8F5E9',
  },
  storeStatusClosed: {
    backgroundColor: Colors.errorLight || '#FFEBEE',
  },
  storeStatusText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
  },
  storeStatusTextOpen: {
    color: Colors.success,
  },
  storeStatusTextClosed: {
    color: Colors.error,
  },
  storeAction: {
    marginLeft: Spacing.md,
  },
  activeIndicator: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  helpText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});
