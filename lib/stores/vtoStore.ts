/**
 * Virtual Try-On Store
 * Manages VTO requests, queue, and results
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { vtoApi } from '../api/vto';

interface VTORequest {
  id: string;
  productImage: string;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface VTOResult {
  id: string;
  productImage: string;
  avatarImage: string;
  vtoImage: string;
  confidence: number;
  createdAt: string;
}

interface VTOStore {
  currentProduct: string | null;
  processing: boolean;
  queue: VTORequest[];
  results: VTOResult[];
  error: string | null;

  // Actions
  setProduct: (imageUri: string) => void;
  requestVTO: (avatarId: string, productImage: string) => Promise<VTOResult>;
  queueRequest: (productImage: string) => void;
  processQueue: () => Promise<void>;
  saveResult: (result: VTOResult) => void;
  clearProduct: () => void;
  getRecentResults: (limit?: number) => VTOResult[];
}

export const useVTOStore = create<VTOStore>()(
  persist(
    (set, get) => ({
      currentProduct: null,
      processing: false,
      queue: [],
      results: [],
      error: null,

      setProduct: (imageUri: string) => {
        set({ currentProduct: imageUri, error: null });
      },

      requestVTO: async (avatarImage: string, productImage: string) => {
        set({ processing: true, error: null });

        try {
          console.log('VTO Store: Starting VTO request', { avatarImage, productImage });

          // 1. Generate VTO with avatar and product images
          const response = await vtoApi.generateVTO(avatarImage, productImage);

          console.log('VTO Store: Job created', response.job_id);

          // 2. Poll for result (max 2 minutes)
          const vtoJob = await vtoApi.pollUntilComplete(response.job_id, 60, 2000);

          if (vtoJob.status === 'failed') {
            throw new Error(vtoJob.error || 'VTO generation failed');
          }

          if (!vtoJob.result_url) {
            throw new Error('VTO result URL not found');
          }

          // 3. Create result object
          const result: VTOResult = {
            id: vtoJob.job_id,
            productImage,
            avatarImage,
            vtoImage: vtoJob.result_url,
            confidence: vtoJob.confidence || 0.85,
            createdAt: new Date().toISOString(),
          };

          console.log('VTO Store: VTO completed successfully', result);

          // 4. Save result
          get().saveResult(result);

          set({ processing: false, currentProduct: null });

          return result;
        } catch (error) {
          console.error('VTO Store: VTO request failed', error);
          set({
            processing: false,
            error: (error as Error).message,
          });
          throw error;
        }
      },

      queueRequest: (productImage: string) => {
        const request: VTORequest = {
          id: `vto_${Date.now()}`,
          productImage,
          timestamp: Date.now(),
          status: 'pending',
        };

        set((state) => ({
          queue: [...state.queue, request],
        }));
      },

      processQueue: async () => {
        const { queue } = get();
        const pendingRequests = queue.filter((req) => req.status === 'pending');

        for (const request of pendingRequests) {
          try {
            // Mark as processing
            set((state) => ({
              queue: state.queue.map((req) =>
                req.id === request.id
                  ? { ...req, status: 'processing' as const }
                  : req
              ),
            }));

            // Process request
            await get().requestVTO('', request.productImage);

            // Mark as completed
            set((state) => ({
              queue: state.queue.map((req) =>
                req.id === request.id
                  ? { ...req, status: 'completed' as const }
                  : req
              ),
            }));
          } catch (error) {
            // Mark as failed
            set((state) => ({
              queue: state.queue.map((req) =>
                req.id === request.id
                  ? { ...req, status: 'failed' as const }
                  : req
              ),
            }));
          }
        }

        // Clean up completed/failed requests
        set((state) => ({
          queue: state.queue.filter((req) => req.status === 'pending'),
        }));
      },

      saveResult: (result: VTOResult) => {
        set((state) => ({
          results: [result, ...state.results].slice(0, 50), // Keep last 50
        }));
      },

      clearProduct: () => {
        set({ currentProduct: null, error: null });
      },

      getRecentResults: (limit = 10) => {
        return get().results.slice(0, limit);
      },
    }),
    {
      name: 'vto-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        results: state.results,
        queue: state.queue,
      }),
    }
  )
);
