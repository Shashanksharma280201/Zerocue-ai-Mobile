import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../lib/stores/authStore';
import { useAvatarStore } from '../lib/stores/avatarStore';
import { Colors } from '../constants/Colors';

// 🔓 BYPASS AUTH FOR TESTING - Set to false to re-enable authentication
const BYPASS_AUTH_FOR_TESTING = false;

export default function Index() {
  const { user, session, currentStore, initialized, initialize } = useAuthStore();
  const { hasAvatar } = useAvatarStore();

  useEffect(() => {
    // Initialize auth state on mount
    console.log('🚀 Index: Initializing auth...');
    initialize();
  }, []);

  useEffect(() => {
    if (initialized) {
      console.log('✅ Index: Auth initialized', {
        hasSession: !!session,
        hasUser: !!user,
        hasStore: !!currentStore
      });
    }
  }, [initialized, session, user, currentStore]);

  // 🔓 BYPASS AUTH - Check avatar first, then go to home
  if (BYPASS_AUTH_FOR_TESTING) {
    console.log('🔓 BYPASSING AUTH - Checking avatar status');
    if (!hasAvatar()) {
      console.log('➡️ No avatar - redirecting to create-avatar');
      return <Redirect href="/(onboarding)/create-avatar" />;
    }
    console.log('➡️ Has avatar - going to home');
    return <Redirect href="/(tabs)/home" />;
  }

  if (!initialized) {
    console.log('⏳ Index: Waiting for auth initialization...');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Not authenticated - show welcome
  if (!session || !user) {
    console.log('➡️ Index: Redirecting to welcome (no auth)');
    return <Redirect href="/(auth)/welcome" />;
  }

  // Authenticated but no store selected - show store selection
  if (!currentStore) {
    console.log('➡️ Index: Redirecting to store selection');
    return <Redirect href="/store-selection" />;
  }

  // Fully authenticated and store selected - go to home
  console.log('➡️ Index: Redirecting to home');
  return <Redirect href="/(tabs)/home" />;
}
