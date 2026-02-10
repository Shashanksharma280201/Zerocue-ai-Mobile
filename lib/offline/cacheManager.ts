import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types';

const CACHE_KEYS = {
  PRODUCTS: '@cache:products',
  PRODUCT_BY_ID: '@cache:product:',
  PRODUCT_BY_BARCODE: '@cache:barcode:',
  CATEGORIES: '@cache:categories',
  STORES: '@cache:stores',
  LAST_SYNC: '@cache:last_sync',
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CacheMetadata {
  timestamp: number;
  expiresAt: number;
}

interface CachedData<T> {
  data: T;
  metadata: CacheMetadata;
}

// Generic cache functions
async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const parsed: CachedData<T> = JSON.parse(cached);

    // Check if cache is expired
    if (Date.now() > parsed.metadata.expiresAt) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error(`Error reading cache for ${key}:`, error);
    return null;
  }
}

async function setCachedData<T>(
  key: string,
  data: T,
  duration: number = CACHE_DURATION
): Promise<void> {
  try {
    const cached: CachedData<T> = {
      data,
      metadata: {
        timestamp: Date.now(),
        expiresAt: Date.now() + duration,
      },
    };

    await AsyncStorage.setItem(key, JSON.stringify(cached));
  } catch (error) {
    console.error(`Error writing cache for ${key}:`, error);
  }
}

async function clearCachedData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error clearing cache for ${key}:`, error);
  }
}

// Product cache functions
export async function getCachedProducts(): Promise<Product[] | null> {
  return getCachedData<Product[]>(CACHE_KEYS.PRODUCTS);
}

export async function setCachedProducts(products: Product[]): Promise<void> {
  await setCachedData(CACHE_KEYS.PRODUCTS, products);

  // Also cache individual products for faster lookup
  for (const product of products) {
    await setCachedProduct(product);
  }
}

export async function getCachedProduct(productId: string): Promise<Product | null> {
  return getCachedData<Product>(CACHE_KEYS.PRODUCT_BY_ID + productId);
}

export async function setCachedProduct(product: Product): Promise<void> {
  await setCachedData(CACHE_KEYS.PRODUCT_BY_ID + product.id, product);

  // Also cache by barcode if available
  if (product.barcode) {
    await setCachedData(CACHE_KEYS.PRODUCT_BY_BARCODE + product.barcode, product);
  }
}

export async function getCachedProductByBarcode(barcode: string): Promise<Product | null> {
  return getCachedData<Product>(CACHE_KEYS.PRODUCT_BY_BARCODE + barcode);
}

export async function getCachedCategories(): Promise<string[] | null> {
  return getCachedData<string[]>(CACHE_KEYS.CATEGORIES);
}

export async function setCachedCategories(categories: string[]): Promise<void> {
  await setCachedData(CACHE_KEYS.CATEGORIES, categories);
}

export async function getCachedStores(): Promise<any[] | null> {
  return getCachedData<any[]>(CACHE_KEYS.STORES);
}

export async function setCachedStores(stores: any[]): Promise<void> {
  await setCachedData(CACHE_KEYS.STORES, stores);
}

// Last sync tracking
export async function getLastSyncTime(): Promise<number | null> {
  const cached = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
  return cached ? parseInt(cached, 10) : null;
}

export async function updateLastSyncTime(): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
}

// Clear all cache
export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith('@cache:'));
    await AsyncStorage.multiRemove(cacheKeys);
    console.log('Cache cleared successfully');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

// Get cache size (for debugging)
export async function getCacheSize(): Promise<string> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith('@cache:'));
    const values = await AsyncStorage.multiGet(cacheKeys);

    let totalSize = 0;
    values.forEach(([_, value]) => {
      if (value) {
        totalSize += value.length;
      }
    });

    const sizeInKB = (totalSize / 1024).toFixed(2);
    return `${sizeInKB} KB`;
  } catch (error) {
    console.error('Error calculating cache size:', error);
    return '0 KB';
  }
}
