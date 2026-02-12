/**
 * Performance Optimization Store
 * Manages app performance metrics and optimization settings
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  networkLatency: number;
  cacheHitRate: number;
  apiCallsCount: number;
  errorRate: number;
}

interface PerformanceSettings {
  enableAnimations: boolean;
  imageQuality: 'low' | 'medium' | 'high' | 'auto';
  preloadImages: boolean;
  cacheSize: number; // MB
  batchAPIRequests: boolean;
  lazyLoadThreshold: number; // pixels
  enableHaptics: boolean;
}

interface PerformanceState {
  metrics: PerformanceMetrics;
  settings: PerformanceSettings;
  networkType: string | null;
  isLowEndDevice: boolean;

  // Actions
  updateMetric: (key: keyof PerformanceMetrics, value: number) => void;
  updateSettings: (settings: Partial<PerformanceSettings>) => void;
  optimizeForNetwork: () => Promise<void>;
  clearCache: () => Promise<void>;
  detectDeviceCapabilities: () => void;
  getRecommendedSettings: () => PerformanceSettings;
}

// Device performance detection
const detectDevicePerformance = (): boolean => {
  // Check available memory (if API available)
  // @ts-ignore - performance API might not be typed
  const memory = (performance as any)?.memory;
  if (memory) {
    const availableMemory = memory.jsHeapSizeLimit - memory.usedJSHeapSize;
    const memoryGB = availableMemory / (1024 * 1024 * 1024);
    if (memoryGB < 1) return true; // Less than 1GB available
  }

  // For React Native, we can check device info
  // This is a simplified check - in production, use react-native-device-info
  return false;
};

export const usePerformanceStore = create<PerformanceState>()(
  subscribeWithSelector((set, get) => ({
    metrics: {
      fps: 60,
      memoryUsage: 0,
      networkLatency: 0,
      cacheHitRate: 0,
      apiCallsCount: 0,
      errorRate: 0,
    },

    settings: {
      enableAnimations: true,
      imageQuality: 'auto',
      preloadImages: true,
      cacheSize: 100, // 100 MB default
      batchAPIRequests: true,
      lazyLoadThreshold: 200,
      enableHaptics: true,
    },

    networkType: null,
    isLowEndDevice: detectDevicePerformance(),

    updateMetric: (key, value) => {
      set((state) => ({
        metrics: {
          ...state.metrics,
          [key]: value,
        },
      }));

      // Auto-optimize if performance drops
      const { fps, memoryUsage } = get().metrics;
      if (fps < 30 || memoryUsage > 80) {
        get().optimizeForNetwork();
      }
    },

    updateSettings: async (newSettings) => {
      set((state) => ({
        settings: {
          ...state.settings,
          ...newSettings,
        },
      }));

      // Persist settings
      try {
        await AsyncStorage.setItem(
          'performance_settings',
          JSON.stringify(get().settings)
        );
      } catch (error) {
        console.error('Error saving performance settings:', error);
      }
    },

    optimizeForNetwork: async () => {
      const netInfo = await NetInfo.fetch();
      const isSlowNetwork = netInfo.type === 'cellular' &&
                           netInfo.details?.cellularGeneration === '2g';

      set({ networkType: netInfo.type });

      if (isSlowNetwork || get().isLowEndDevice) {
        // Optimize for slow network or low-end device
        get().updateSettings({
          enableAnimations: false,
          imageQuality: 'low',
          preloadImages: false,
          batchAPIRequests: true,
          lazyLoadThreshold: 500,
          enableHaptics: false,
        });
      } else if (netInfo.type === 'wifi') {
        // Optimize for WiFi
        get().updateSettings({
          enableAnimations: true,
          imageQuality: 'high',
          preloadImages: true,
          batchAPIRequests: false,
          lazyLoadThreshold: 100,
          enableHaptics: true,
        });
      } else {
        // Balanced settings for cellular
        get().updateSettings({
          enableAnimations: true,
          imageQuality: 'medium',
          preloadImages: false,
          batchAPIRequests: true,
          lazyLoadThreshold: 300,
          enableHaptics: true,
        });
      }
    },

    clearCache: async () => {
      try {
        // Clear image cache
        const cacheKeys = await AsyncStorage.getAllKeys();
        const imageCacheKeys = cacheKeys.filter(key =>
          key.startsWith('image_cache_') || key.startsWith('fashion_cache_')
        );

        await AsyncStorage.multiRemove(imageCacheKeys);

        // Reset cache metrics
        set((state) => ({
          metrics: {
            ...state.metrics,
            cacheHitRate: 0,
          },
        }));

        return Promise.resolve();
      } catch (error) {
        console.error('Error clearing cache:', error);
        return Promise.reject(error);
      }
    },

    detectDeviceCapabilities: () => {
      const isLowEnd = detectDevicePerformance();
      set({ isLowEndDevice: isLowEnd });

      // Apply recommended settings based on device
      const recommended = get().getRecommendedSettings();
      get().updateSettings(recommended);
    },

    getRecommendedSettings: (): PerformanceSettings => {
      const { isLowEndDevice, networkType } = get();

      if (isLowEndDevice) {
        return {
          enableAnimations: false,
          imageQuality: 'low',
          preloadImages: false,
          cacheSize: 50,
          batchAPIRequests: true,
          lazyLoadThreshold: 500,
          enableHaptics: false,
        };
      }

      if (networkType === 'wifi') {
        return {
          enableAnimations: true,
          imageQuality: 'high',
          preloadImages: true,
          cacheSize: 200,
          batchAPIRequests: false,
          lazyLoadThreshold: 100,
          enableHaptics: true,
        };
      }

      // Default balanced settings
      return {
        enableAnimations: true,
        imageQuality: 'auto',
        preloadImages: true,
        cacheSize: 100,
        batchAPIRequests: true,
        lazyLoadThreshold: 200,
        enableHaptics: true,
      };
    },
  }))
);

// Initialize performance monitoring
export const initializePerformanceMonitoring = () => {
  const store = usePerformanceStore.getState();

  // Monitor network changes
  NetInfo.addEventListener(state => {
    store.optimizeForNetwork();
  });

  // Load saved settings
  AsyncStorage.getItem('performance_settings').then(settings => {
    if (settings) {
      store.updateSettings(JSON.parse(settings));
    }
  });

  // Detect device capabilities on startup
  store.detectDeviceCapabilities();

  // Monitor FPS (simplified - in production use better FPS tracking)
  let frameCount = 0;
  let lastTime = Date.now();

  const measureFPS = () => {
    frameCount++;
    const currentTime = Date.now();
    const delta = currentTime - lastTime;

    if (delta >= 1000) {
      const fps = Math.round((frameCount * 1000) / delta);
      store.updateMetric('fps', fps);
      frameCount = 0;
      lastTime = currentTime;
    }

    requestAnimationFrame(measureFPS);
  };

  measureFPS();
};

// Performance hooks
export const useAnimationsEnabled = () =>
  usePerformanceStore(state => state.settings.enableAnimations);

export const useImageQuality = () =>
  usePerformanceStore(state => state.settings.imageQuality);

export const useHapticsEnabled = () =>
  usePerformanceStore(state => state.settings.enableHaptics);

export const useNetworkOptimized = () => {
  const networkType = usePerformanceStore(state => state.networkType);
  const isLowEnd = usePerformanceStore(state => state.isLowEndDevice);

  return {
    shouldReduceQuality: networkType === 'cellular' || isLowEnd,
    shouldBatchRequests: networkType !== 'wifi',
    shouldPreload: networkType === 'wifi' && !isLowEnd,
  };
};