import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AsyncStorage wrapper with synchronous-like interface
 * Provides persistent key-value storage for React Native
 */

/**
 * Storage wrapper with JSON support
 */
export const mmkvStorage = {
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
    }
  },
  getItem: async (key: string): Promise<string | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ?? null;
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
    }
  },
};

/**
 * Typed storage helpers
 */
export const storageHelpers = {
  /**
   * Save JSON data
   */
  setJSON: async <T>(key: string, value: T): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting JSON for key ${key}:`, error);
    }
  },

  /**
   * Get JSON data
   */
  getJSON: async <T>(key: string): Promise<T | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Error parsing JSON for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Check if key exists
   */
  has: async (key: string): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch (error) {
      console.error(`Error checking key ${key}:`, error);
      return false;
    }
  },

  /**
   * Clear all storage (use with caution!)
   */
  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};
