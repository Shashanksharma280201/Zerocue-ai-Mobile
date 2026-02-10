import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStore } from '../lib/offline/networkManager';
import { Colors, Spacing, FontWeight } from '../constants/Colors';

export function NetworkStatusBanner() {
  const { isConnected, isInternetReachable } = useNetworkStore();

  // Don't show banner if connected
  if (isConnected && isInternetReachable !== false) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline" size={18} color={Colors.white} />
      <Text style={styles.text}>
        {isInternetReachable === false
          ? 'No internet connection - Using cached data'
          : 'Offline mode - Limited functionality'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FF6B35',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  text: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: FontWeight.medium,
  },
});
