import { useQuery } from '@tanstack/react-query';
import { fetchProducts, fetchProductsByStore, fetchProductById, fetchProductByBarcode, searchProducts } from '../api';

/**
 * Hook to fetch all products
 */
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch products for a specific store
 */
export function useProductsByStore(storeId: string | null) {
  return useQuery({
    queryKey: ['products', 'store', storeId],
    queryFn: () => fetchProductsByStore(storeId!),
    enabled: !!storeId, // Only run if storeId exists
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(productId: string | null) {
  return useQuery({
    queryKey: ['products', productId],
    queryFn: () => fetchProductById(productId!),
    enabled: !!productId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch a product by barcode
 */
export function useProductByBarcode(barcode: string | null) {
  return useQuery({
    queryKey: ['products', 'barcode', barcode],
    queryFn: () => fetchProductByBarcode(barcode!),
    enabled: !!barcode,
    retry: 1, // Only retry once for barcode lookups
  });
}

/**
 * Hook to search products
 */
export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: () => searchProducts(query),
    enabled: query.length > 2, // Only search if query is 3+ characters
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
