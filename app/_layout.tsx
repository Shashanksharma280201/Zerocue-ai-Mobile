import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { initializeNetworkListener } from '../lib/offline/networkManager';
import { NetworkStatusBanner } from '../components/NetworkStatusBanner';
import '../lib/i18n'; // Initialize i18n

export default function RootLayout() {
  // Create a client instance for React Query
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        staleTime: 5 * 60 * 1000, // 5 minutes default
        gcTime: 10 * 60 * 1000, // 10 minutes cache time
      },
    },
  }));

  // Initialize network state listener
  useEffect(() => {
    console.log('Initializing network state listener');
    const unsubscribe = initializeNetworkListener();

    // Cleanup on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <View style={styles.container}>
        <NetworkStatusBanner />
        <Slot />
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
