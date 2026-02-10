import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { create } from 'zustand';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  lastChecked: number;

  setConnectionStatus: (state: NetInfoState) => void;
  checkConnection: () => Promise<void>;
}

export const useNetworkStore = create<NetworkState>()((set) => ({
  isConnected: true,
  isInternetReachable: null,
  connectionType: null,
  lastChecked: Date.now(),

  setConnectionStatus: (state) => {
    set({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      connectionType: state.type,
      lastChecked: Date.now(),
    });
  },

  checkConnection: async () => {
    const state = await NetInfo.fetch();
    set({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      connectionType: state.type,
      lastChecked: Date.now(),
    });
  },
}));

// Initialize network listener
export function initializeNetworkListener() {
  const unsubscribe = NetInfo.addEventListener((state) => {
    console.log('Network state changed:', {
      isConnected: state.isConnected,
      type: state.type,
    });
    useNetworkStore.getState().setConnectionStatus(state);
  });

  // Initial check
  useNetworkStore.getState().checkConnection();

  return unsubscribe;
}

// Check if device is online
export function isOnline(): boolean {
  return useNetworkStore.getState().isConnected;
}

// Wait for connection to be restored
export function waitForConnection(timeoutMs: number = 30000): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      resolve(false);
    }, timeoutMs);

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        clearTimeout(timeout);
        unsubscribe();
        resolve(true);
      }
    });

    // Check immediately in case we're already online
    if (isOnline()) {
      clearTimeout(timeout);
      unsubscribe();
      resolve(true);
    }
  });
}
