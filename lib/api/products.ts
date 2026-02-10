import { supabase } from '../supabase';
import { Product, StoreInventory } from '../types';
import { isOnline } from '../offline/networkManager';
import {
  getCachedProducts,
  setCachedProducts,
  getCachedProduct,
  setCachedProduct,
  getCachedProductByBarcode,
  getCachedCategories,
  setCachedCategories,
} from '../offline/cacheManager';

/**
 * Mock products for development/testing when Supabase is not available
 */
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'mock-1',
    tenant_id: 'default',
    sku: 'SKU-001',
    barcode: '1234567890123',
    name: 'Classic Denim Jeans',
    mrp: 3499,
    tax_rate: 5,
    category: 'Clothing',
    description: 'Premium denim jeans with classic fit',
    attributes: {
      brand: "Levi's",
      color: 'Blue',
      sizes: ['28', '30', '32', '34', '36'],
      colors: ['Blue', 'Black', 'Gray'],
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-2',
    tenant_id: 'default',
    sku: 'SKU-002',
    barcode: '1234567890124',
    name: 'Cotton T-Shirt',
    mrp: 999,
    tax_rate: 5,
    category: 'Clothing',
    description: 'Comfortable cotton t-shirt',
    attributes: {
      brand: 'H&M',
      color: 'White',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['White', 'Black', 'Gray', 'Navy'],
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-3',
    tenant_id: 'default',
    sku: 'SKU-003',
    barcode: '1234567890125',
    name: 'Leather Jacket',
    mrp: 8999,
    tax_rate: 5,
    category: 'Clothing',
    description: 'Genuine leather jacket',
    attributes: {
      brand: 'Zara',
      color: 'Black',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Black', 'Brown'],
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-4',
    tenant_id: 'default',
    sku: 'SKU-004',
    barcode: '1234567890126',
    name: 'Running Shoes',
    mrp: 5999,
    tax_rate: 5,
    category: 'Footwear',
    description: 'Lightweight running shoes',
    attributes: {
      brand: 'Nike',
      color: 'Black',
      sizes: ['7', '8', '9', '10', '11'],
      colors: ['Black', 'White', 'Blue'],
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-5',
    tenant_id: 'default',
    sku: 'SKU-005',
    barcode: '1234567890127',
    name: 'Oversized Hoodie',
    mrp: 2999,
    tax_rate: 5,
    category: 'Clothing',
    description: 'Comfortable oversized hoodie',
    attributes: {
      brand: 'Adidas',
      color: 'Gray',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Gray', 'Black', 'Navy'],
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-6',
    tenant_id: 'default',
    sku: 'SKU-006',
    barcode: '1234567890128',
    name: 'Slim Fit Chinos',
    mrp: 2499,
    tax_rate: 5,
    category: 'Clothing',
    description: 'Modern slim fit chinos',
    attributes: {
      brand: 'Zara',
      color: 'Beige',
      sizes: ['28', '30', '32', '34', '36'],
      colors: ['Beige', 'Navy', 'Olive'],
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Fetch all products from Supabase (with offline support)
 */
export async function fetchProducts() {
  // Check if offline - return cached data
  if (!isOnline()) {
    console.log('Offline mode: Loading products from cache');
    const cached = await getCachedProducts();
    if (cached) {
      return cached;
    }
    throw new Error('No internet connection and no cached data available');
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.log('Supabase error fetching products:', error?.message || 'Unknown error');

      // If it's a table not found error or permission error, use mock data
      if (error.code === '42P01' || error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('permission')) {
        console.log('WARNING: Supabase table not found or permission denied - using mock data for development');
        console.log('INFO: To use real data: Set up products table in Supabase or connect to zentro-pos backend');
        return MOCK_PRODUCTS;
      }

      // Try to fallback to cache if network request fails
      const cached = await getCachedProducts();
      if (cached) {
        console.log('Using cached products after error');
        return cached;
      }
      throw error;
    }

    // If data is empty, use mock data for development
    if (!data || data.length === 0) {
      console.log('WARNING: No products found in Supabase - using mock data for development');
      console.log('INFO: To add real products: Insert data into the products table in Supabase');
      return MOCK_PRODUCTS;
    }

    // Cache the fresh data
    await setCachedProducts(data as Product[]);

    return data as Product[];
  } catch (err: any) {
    console.log('Network error fetching products:', err?.message || 'Unknown error');

    // Try to fallback to cache if network request fails
    const cached = await getCachedProducts();
    if (cached) {
      console.log('Using cached products after network error');
      return cached;
    }

    // Last resort: use mock data
    console.log('WARNING: Using mock data due to network error');
    return MOCK_PRODUCTS;
  }
}

/**
 * Fetch products with inventory for a specific store
 */
export async function fetchProductsByStore(storeId: string) {
  const { data, error } = await supabase
    .from('store_inventory')
    .select(`
      *,
      product:products (*)
    `)
    .eq('store_id', storeId)
    .gt('qty_on_hand', 0); // Only show products in stock

  if (error) {
    console.error('Error fetching store products:', error);
    throw error;
  }

  return data as StoreInventory[];
}

/**
 * Fetch a single product by ID (with offline support)
 */
export async function fetchProductById(productId: string) {
  // Check if offline - return cached data
  if (!isOnline()) {
    console.log(`Offline mode: Loading product ${productId} from cache`);
    const cached = await getCachedProduct(productId);
    if (cached) {
      return cached;
    }
    throw new Error('No internet connection and product not in cache');
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      // Try to fallback to cache
      const cached = await getCachedProduct(productId);
      if (cached) {
        console.log('Using cached product after error');
        return cached;
      }
      throw error;
    }

    // Cache the product
    await setCachedProduct(data as Product);

    return data as Product;
  } catch (err) {
    // Try to fallback to cache
    const cached = await getCachedProduct(productId);
    if (cached) {
      console.log('Using cached product after network error');
      return cached;
    }
    throw err;
  }
}

/**
 * Fetch a product by barcode - PRODUCTION READY (with offline support)
 * This is the critical function used by the barcode scanner
 */
export async function fetchProductByBarcode(barcode: string) {
  // Check if offline - return cached data
  if (!isOnline()) {
    console.log(`Offline mode: Loading product by barcode ${barcode} from cache`);
    const cached = await getCachedProductByBarcode(barcode);
    if (cached) {
      return cached;
    }
    // Return null in offline mode if not in cache (scanner expects null for "not found")
    console.log(`Product with barcode ${barcode} not in cache`);
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .single();

    if (error) {
      // If no product found, return null instead of throwing
      if (error.code === 'PGRST116') {
        console.log(`Product with barcode ${barcode} not found`);
        return null;
      }
      // Try to fallback to cache for other errors
      console.error('Error fetching product by barcode:', error);
      const cached = await getCachedProductByBarcode(barcode);
      if (cached) {
        console.log('Using cached product by barcode after error');
        return cached;
      }
      throw error;
    }

    // Cache the product
    if (data) {
      await setCachedProduct(data as Product);
    }

    return data as Product;
  } catch (err) {
    // Try to fallback to cache
    const cached = await getCachedProductByBarcode(barcode);
    if (cached) {
      console.log('Using cached product by barcode after network error');
      return cached;
    }
    // Return null for scanner compatibility
    return null;
  }
}

/**
 * Search products by name, SKU, or category
 */
export async function searchProducts(query: string) {
  const searchTerm = `%${query}%`;

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.${searchTerm},sku.ilike.${searchTerm},category.ilike.${searchTerm}`)
    .limit(20);

  if (error) {
    console.error('Error searching products:', error);
    throw error;
  }

  return data as Product[];
}

/**
 * Fetch products by category
 */
export async function fetchProductsByCategory(category: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }

  return data as Product[];
}

/**
 * Fetch all product categories (with offline support)
 */
export async function fetchProductCategories() {
  // Check if offline - return cached data
  if (!isOnline()) {
    console.log('Offline mode: Loading categories from cache');
    const cached = await getCachedCategories();
    if (cached) {
      return cached;
    }
    // If no cache, try to derive from cached products
    const cachedProducts = await getCachedProducts();
    if (cachedProducts) {
      const categories = [...new Set(cachedProducts.map(p => p.category).filter(Boolean))];
      return categories as string[];
    }
    throw new Error('No internet connection and no cached categories available');
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null);

    if (error) {
      console.error('Error fetching categories:', error);
      // Try to fallback to cache
      const cached = await getCachedCategories();
      if (cached) {
        console.log('Using cached categories after error');
        return cached;
      }
      throw error;
    }

    // Get unique categories
    const categories = [...new Set(data.map(p => p.category))];

    // Cache the categories
    await setCachedCategories(categories as string[]);

    return categories as string[];
  } catch (err) {
    // Try to fallback to cache
    const cached = await getCachedCategories();
    if (cached) {
      console.log('Using cached categories after network error');
      return cached;
    }
    throw err;
  }
}
