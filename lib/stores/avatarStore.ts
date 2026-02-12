/**
 * Avatar Store - Manages user's VTO avatar
 * Single photo approach for optimal performance
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

interface Avatar {
  id: string;
  imageUrl: string;           // Backend URL (full res)
  thumbnailUrl: string;       // Backend URL (thumbnail)
  localUri: string | null;    // Cached local path
  uploadedAt: string;
  cached: boolean;
}

interface AvatarStore {
  avatar: Avatar | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAvatar: (imageUri: string) => Promise<void>;
  updateAvatar: (imageUri: string) => Promise<void>;
  cacheAvatarLocally: () => Promise<void>;
  clearAvatar: () => void;
  hasAvatar: () => boolean;
}

export const useAvatarStore = create<AvatarStore>()(
  persist(
    (set, get) => ({
      avatar: null,
      isLoading: false,
      error: null,

      setAvatar: async (imageUri: string) => {
        set({ isLoading: true, error: null });

        try {
          // 1. Optimize image
          const optimized = await optimizeAvatarImage(imageUri);

          // 2. Upload to backend (implement your upload logic)
          const uploadedAvatar = {
            id: `avatar_${Date.now()}`,
            imageUrl: optimized.fullImage,
            thumbnailUrl: optimized.thumbnail,
            localUri: imageUri,
            uploadedAt: new Date().toISOString(),
            cached: true,
          };

          set({ avatar: uploadedAvatar, isLoading: false });

          // 3. Cache locally for instant access
          await get().cacheAvatarLocally();
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      updateAvatar: async (imageUri: string) => {
        await get().setAvatar(imageUri);
      },

      cacheAvatarLocally: async () => {
        // Caching simplified - avatar images are already optimized
        // Future: Implement proper caching with new FileSystem API
        console.log('Avatar caching skipped - using optimized URIs');
      },

      clearAvatar: () => {
        set({ avatar: null, error: null });
      },

      hasAvatar: () => {
        return get().avatar !== null;
      },
    }),
    {
      name: 'avatar-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Optimize avatar image for upload and display
 */
async function optimizeAvatarImage(uri: string) {
  // Full resolution (max 1024px width)
  const fullImage = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    {
      compress: 0.8,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  // Thumbnail (200x200)
  const thumbnail = await ImageManipulator.manipulateAsync(
    uri,
    [
      { resize: { width: 200, height: 200 } },
    ],
    {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  return {
    fullImage: fullImage.uri,
    thumbnail: thumbnail.uri,
  };
}
