import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types';

export interface ShoppingListItem {
  productId: string;
  product: Product;
  quantity: number;
  checked: boolean;
  addedAt: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  description?: string;
  items: ShoppingListItem[];
  createdAt: string;
  updatedAt: string;
  emoji?: string;
}

interface ShoppingListState {
  lists: ShoppingList[];

  // List management
  createList: (name: string, description?: string, emoji?: string) => ShoppingList;
  deleteList: (listId: string) => void;
  updateList: (listId: string, updates: Partial<Omit<ShoppingList, 'id' | 'items' | 'createdAt'>>) => void;

  // Item management
  addItemToList: (listId: string, product: Product, quantity?: number) => void;
  removeItemFromList: (listId: string, productId: string) => void;
  updateItemQuantity: (listId: string, productId: string, quantity: number) => void;
  toggleItemChecked: (listId: string, productId: string) => void;
  clearCheckedItems: (listId: string) => void;

  // Getters
  getList: (listId: string) => ShoppingList | undefined;
  getListItemCount: (listId: string) => number;
  getCheckedItemCount: (listId: string) => number;
}

export const useShoppingListStore = create<ShoppingListState>()(
  persist(
    (set, get) => ({
      lists: [],

      createList: (name, description, emoji) => {
        const newList: ShoppingList = {
          id: Date.now().toString(),
          name,
          description,
          emoji: emoji || '📝',
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          lists: [...state.lists, newList],
        }));

        return newList;
      },

      deleteList: (listId) => {
        set((state) => ({
          lists: state.lists.filter((list) => list.id !== listId),
        }));
      },

      updateList: (listId, updates) => {
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === listId
              ? { ...list, ...updates, updatedAt: new Date().toISOString() }
              : list
          ),
        }));
      },

      addItemToList: (listId, product, quantity = 1) => {
        set((state) => ({
          lists: state.lists.map((list) => {
            if (list.id !== listId) return list;

            // Check if item already exists
            const existingItem = list.items.find((item) => item.productId === product.id);
            if (existingItem) {
              // Update quantity
              return {
                ...list,
                items: list.items.map((item) =>
                  item.productId === product.id
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
                ),
                updatedAt: new Date().toISOString(),
              };
            }

            // Add new item
            return {
              ...list,
              items: [
                ...list.items,
                {
                  productId: product.id,
                  product,
                  quantity,
                  checked: false,
                  addedAt: new Date().toISOString(),
                },
              ],
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      removeItemFromList: (listId, productId) => {
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === listId
              ? {
                  ...list,
                  items: list.items.filter((item) => item.productId !== productId),
                  updatedAt: new Date().toISOString(),
                }
              : list
          ),
        }));
      },

      updateItemQuantity: (listId, productId, quantity) => {
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === listId
              ? {
                  ...list,
                  items: list.items.map((item) =>
                    item.productId === productId ? { ...item, quantity } : item
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : list
          ),
        }));
      },

      toggleItemChecked: (listId, productId) => {
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === listId
              ? {
                  ...list,
                  items: list.items.map((item) =>
                    item.productId === productId ? { ...item, checked: !item.checked } : item
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : list
          ),
        }));
      },

      clearCheckedItems: (listId) => {
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === listId
              ? {
                  ...list,
                  items: list.items.filter((item) => !item.checked),
                  updatedAt: new Date().toISOString(),
                }
              : list
          ),
        }));
      },

      getList: (listId) => {
        return get().lists.find((list) => list.id === listId);
      },

      getListItemCount: (listId) => {
        const list = get().lists.find((list) => list.id === listId);
        return list?.items.length || 0;
      },

      getCheckedItemCount: (listId) => {
        const list = get().lists.find((list) => list.id === listId);
        return list?.items.filter((item) => item.checked).length || 0;
      },
    }),
    {
      name: 'shopping-lists-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
