import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/Colors';
import { useAuthStore } from '../../lib/stores/authStore';
import { fetchUserOrders } from '../../lib/api/orders';
import { getCacheSize, clearAllCache } from '../../lib/offline/cacheManager';

// Menu sections
const ACCOUNT_MENU = [
  { id: '1', icon: 'receipt-outline', title: 'My Orders', desc: 'View order history', action: 'orders' },
  { id: '2', icon: 'storefront-outline', title: 'Current Store', desc: 'Change store location', action: 'store' },
  { id: '3', icon: 'trash-outline', title: 'Clear Cache', desc: 'Free up storage space', action: 'clear-cache' },
];

const SUPPORT_MENU = [
  { id: '1', icon: 'help-circle-outline', title: 'Help Center', desc: 'FAQs and support', action: null },
  { id: '2', icon: 'shield-checkmark-outline', title: 'Privacy', desc: 'Data and security', action: null },
  { id: '3', icon: 'information-circle-outline', title: 'About ZeroCue', desc: 'App version 1.0.0', action: null },
];

export default function Profile() {
  const { user, currentStore, signOut } = useAuthStore();
  const [orderCount, setOrderCount] = useState(0);
  const [cacheSize, setCacheSize] = useState('0 KB');

  useEffect(() => {
    loadStats();
  }, [user]);

  async function loadStats() {
    if (!user) return;

    try {
      // Load order count
      const orders = await fetchUserOrders(user.id);
      setOrderCount(orders.length);

      // Load cache size
      const size = await getCacheSize();
      setCacheSize(size);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }

  function getInitials(name?: string): string {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  const handleMenuPress = (action: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (action === 'orders') {
      router.push('/(tabs)/orders');
    } else if (action === 'store') {
      router.push('/store-selection');
    } else if (action === 'clear-cache') {
      Alert.alert(
        'Clear Cache',
        `This will clear ${cacheSize} of cached data. You'll need to re-download products when online.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: async () => {
              await clearAllCache();
              setCacheSize('0 KB');
              Alert.alert('Cache Cleared', 'All cached data has been removed.');
            },
          },
        ]
      );
    } else {
      Alert.alert('Coming Soon', 'This feature is under development.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await signOut();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/preferences');
            }}
          >
            <Ionicons name="settings-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileOuter}>
            <View style={styles.profileInner}>
              <View style={styles.profileInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(user?.name || user?.phone)}</Text>
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
                  <Text style={styles.userEmail}>{user?.phone || user?.email || 'No contact info'}</Text>
                  {currentStore && (
                    <View style={styles.memberBadge}>
                      <Ionicons name="storefront" size={10} color={Colors.primary} />
                      <Text style={styles.memberText}>{currentStore.name}</Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/edit-profile');
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={16} color={Colors.white} />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(tabs)/orders')}
            activeOpacity={0.8}
          >
            <View style={styles.statIcon}>
              <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{orderCount}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => handleMenuPress('clear-cache')}
            activeOpacity={0.8}
          >
            <View style={styles.statIcon}>
              <Ionicons name="folder-outline" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{cacheSize}</Text>
            <Text style={styles.statLabel}>Cache</Text>
          </TouchableOpacity>
          {currentStore && (
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => router.push('/store-selection')}
              activeOpacity={0.8}
            >
              <View style={styles.statIcon}>
                <Ionicons name="storefront-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>1</Text>
              <Text style={styles.statLabel}>Store</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* AI Features Banner */}
        <TouchableOpacity
          style={styles.aiFeaturesBanner}
          activeOpacity={0.9}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/how-it-works');
          }}
        >
          <View style={styles.aiIconContainer}>
            <Ionicons name="sparkles" size={28} color={Colors.fashion.ocean} />
          </View>
          <View style={styles.aiContent}>
            <Text style={styles.aiTitle}>AI Fashion Features</Text>
            <Text style={styles.aiSubtitle}>Discover smart shopping powered by AI</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuGroup}>
            {ACCOUNT_MENU.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuPress(item.action)}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon as any} size={22} color={Colors.text} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuDesc}>
                    {item.action === 'store' && currentStore
                      ? currentStore.name
                      : item.action === 'clear-cache'
                      ? `${cacheSize} cached`
                      : item.desc}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuGroup}>
            {SUPPORT_MENU.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuPress(item.action)}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon as any} size={22} color={Colors.text} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuDesc}>{item.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
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
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  profileCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  profileOuter: {
    backgroundColor: Colors.fashion.ocean,
    padding: 3,
    borderRadius: BorderRadius.xl,
  },
  profileInner: {
    backgroundColor: Colors.fashion.cream,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl - 3,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
    letterSpacing: 0,
  },
  userDetails: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
    marginTop: 4,
  },
  memberText: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    letterSpacing: 0,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
    letterSpacing: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  aiFeaturesBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.fashion.ocean + '30',
    gap: Spacing.md,
  },
  aiIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.fashion.ocean + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiContent: {
    flex: 1,
    gap: 4,
  },
  aiTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  aiSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cream[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    paddingHorizontal: 4,
  },
  menuGroup: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cream[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuContent: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  menuDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.error,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    color: Colors.error,
    letterSpacing: 0,
  },
});
