import { supabase } from '../supabase';
import { Store } from '../types';
import { isOnline } from '../offline/networkManager';
import { getCachedStores, setCachedStores } from '../offline/cacheManager';

/**
 * Fetch all stores (with offline support)
 */
export async function fetchStores() {
  // Check if offline - return cached data
  if (!isOnline()) {
    console.log('Offline mode: Loading stores from cache');
    const cached = await getCachedStores();
    if (cached) {
      return cached;
    }
    throw new Error('No internet connection and no cached stores available');
  }

  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('name', { ascending: true});

    if (error) {
      console.error('Error fetching stores:', error);
      console.error('Supabase error details:', JSON.stringify(error, null, 2));

      // Try to fallback to cache
      const cached = await getCachedStores();
      if (cached && cached.length > 0) {
        console.log('Using cached stores after error');
        return cached;
      }

      // If no cache, return mock stores for testing
      console.warn('No stores in database and no cache. Returning mock stores for testing.');
      return getMockStores();
    }

    if (!data || data.length === 0) {
      console.warn('No stores found in database. Returning mock stores for testing.');
      return getMockStores();
    }

    // Cache the stores
    await setCachedStores(data as Store[]);

    return data as Store[];
  } catch (err) {
    console.error('Exception fetching stores:', err);

    // Try to fallback to cache
    const cached = await getCachedStores();
    if (cached && cached.length > 0) {
      console.log('Using cached stores after network error');
      return cached;
    }

    // Return mock stores as last resort
    console.warn('Returning mock stores due to error');
    return getMockStores();
  }
}

/**
 * Mock stores for testing when database is empty
 */
function getMockStores(): Store[] {
  return [
    {
      id: 'mock-store-1',
      name: 'Phoenix Mall Store',
      address: '123 Main Street, Phoenix Mall, Bangalore',
      geo: { lat: 12.9716, lng: 77.5946 }, // Bangalore coordinates
      open_hours: {
        monday: { open: '10:00', close: '22:00' },
        tuesday: { open: '10:00', close: '22:00' },
        wednesday: { open: '10:00', close: '22:00' },
        thursday: { open: '10:00', close: '22:00' },
        friday: { open: '10:00', close: '22:00' },
        saturday: { open: '10:00', close: '23:00' },
        sunday: { open: '10:00', close: '23:00' },
      },
    },
    {
      id: 'mock-store-2',
      name: 'Orion Mall Store',
      address: '456 Brigade Road, Orion Mall, Bangalore',
      geo: { lat: 13.0101, lng: 77.5526 },
      open_hours: {
        monday: { open: '10:00', close: '22:00' },
        tuesday: { open: '10:00', close: '22:00' },
        wednesday: { open: '10:00', close: '22:00' },
        thursday: { open: '10:00', close: '22:00' },
        friday: { open: '10:00', close: '22:00' },
        saturday: { open: '10:00', close: '23:00' },
        sunday: { open: '10:00', close: '23:00' },
      },
    },
    {
      id: 'mock-store-3',
      name: 'Forum Mall Store',
      address: '789 Hosur Road, Forum Mall, Bangalore',
      geo: { lat: 12.9344, lng: 77.6101 },
      open_hours: {
        monday: { open: '10:00', close: '22:00' },
        tuesday: { open: '10:00', close: '22:00' },
        wednesday: { open: '10:00', close: '22:00' },
        thursday: { open: '10:00', close: '22:00' },
        friday: { open: '10:00', close: '22:00' },
        saturday: { open: '10:00', close: '23:00' },
        sunday: { open: '10:00', close: '23:00' },
      },
    },
  ];
}

/**
 * Fetch a single store by ID
 */
export async function fetchStoreById(storeId: string) {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .single();

  if (error) {
    console.error('Error fetching store:', error);
    throw error;
  }

  return data as Store;
}

/**
 * Fetch nearby stores based on lat/lng (future implementation)
 */
export async function fetchNearbyStores(lat: number, lng: number, radiusKm: number = 10) {
  // TODO: Implement PostGIS distance query when location permissions are added
  // For now, just return all stores
  return fetchStores();
}
