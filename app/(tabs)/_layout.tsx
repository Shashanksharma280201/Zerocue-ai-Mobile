import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '../../constants/Colors';
import { View, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { useAuthStore } from '../../lib/stores/authStore';
import { FloatingTabBar } from '../../components/navigation/FloatingTabBar';

export default function TabLayout() {
  const router = useRouter();
  const { currentStore } = useAuthStore();

  // Redirect to store selection if no store is selected
  useEffect(() => {
    if (!currentStore) {
      router.replace('/store-selection');
    }
  }, [currentStore]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="vto"
        options={{
          title: 'Try-On',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'sparkles' : 'sparkles-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: 'Wardrobe',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'shirt' : 'shirt-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />
      {/* Hidden screens - not shown in tab bar */}
      <Tabs.Screen
        name="scan"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

// Styles removed as we're using custom FloatingTabBar component
