import { useQuery } from '@tanstack/react-query';
import { fetchStores, fetchStoreById } from '../api';

/**
 * Hook to fetch all stores
 */
export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: fetchStores,
    staleTime: 10 * 60 * 1000, // 10 minutes - stores don't change often
  });
}

/**
 * Hook to fetch a single store by ID
 */
export function useStore(storeId: string | null) {
  return useQuery({
    queryKey: ['stores', storeId],
    queryFn: () => fetchStoreById(storeId!),
    enabled: !!storeId,
    staleTime: 10 * 60 * 1000,
  });
}
