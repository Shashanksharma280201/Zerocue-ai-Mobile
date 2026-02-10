import { StateCreator, StoreMutatorIdentifier } from 'zustand';
import { storageHelpers } from './storage';

/**
 * Persist middleware for Zustand using AsyncStorage
 * Automatically saves and restores state from storage
 */
export type Persist = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  config: StateCreator<T, Mps, Mcs>,
  options: {
    name: string;
    partialize?: (state: T) => Partial<T>;
    onRehydrateStorage?: (state: T) => void;
  }
) => StateCreator<T, Mps, Mcs>;

/**
 * Create a persist middleware
 */
export const persist: Persist =
  (config, options) => (set, get, api) => {
    const { name, partialize, onRehydrateStorage } = options;

    // Restore state from storage on initialization (async)
    storageHelpers.getJSON<any>(name).then((savedState) => {
      if (savedState) {
        // Merge saved state with current state
        set(savedState as any);

        // Call rehydration callback
        if (onRehydrateStorage) {
          onRehydrateStorage(get());
        }
      }
    }).catch((error) => {
      console.error(`Error rehydrating state for ${name}:`, error);
    });

    // Create the store with persistence
    const store = config(
      (partial, replace) => {
        set(partial, replace);

        // Save to storage after each update (async, fire-and-forget)
        const state = get();
        const stateToSave = partialize ? partialize(state) : state;
        storageHelpers.setJSON(name, stateToSave).catch((error) => {
          console.error(`Error persisting state for ${name}:`, error);
        });
      },
      get,
      api
    );

    return store;
  };
