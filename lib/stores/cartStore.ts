import { create } from 'zustand';
import { LocalCartItem, Product, Store } from '../types';
import { persist } from '../persist';

interface CartState {
  items: LocalCartItem[];
  selectedStore: Store | null;

  // Actions
  setStore: (store: Store) => void;
  addItem: (product: Product, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;

  // Computed
  getSubtotal: () => number;
  getTotalTax: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      selectedStore: null,

  setStore: (store) => set({ selectedStore: store }),

  addItem: (product, qty = 1) => {
    const items = get().items;
    const existingItemIndex = items.findIndex((item) => item.product.id === product.id);

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...items];
      const newQty = updatedItems[existingItemIndex].qty + qty;
      const unitPrice = product.mrp;
      const tax = (unitPrice * product.tax_rate) / 100;
      const subtotal = (unitPrice + tax) * newQty;

      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        qty: newQty,
        subtotal,
      };

      set({ items: updatedItems });
    } else {
      // Add new item
      const unitPrice = product.mrp;
      const tax = (unitPrice * product.tax_rate) / 100;
      const subtotal = (unitPrice + tax) * qty;

      set({
        items: [
          ...items,
          {
            product,
            qty,
            unit_price: unitPrice,
            tax,
            subtotal,
          },
        ],
      });
    }
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
    }));
  },

  updateQuantity: (productId, qty) => {
    if (qty <= 0) {
      get().removeItem(productId);
      return;
    }

    const items = get().items;
    const itemIndex = items.findIndex((item) => item.product.id === productId);

    if (itemIndex >= 0) {
      const updatedItems = [...items];
      const item = updatedItems[itemIndex];
      const unitPrice = item.product.mrp;
      const tax = (unitPrice * item.product.tax_rate) / 100;
      const subtotal = (unitPrice + tax) * qty;

      updatedItems[itemIndex] = {
        ...item,
        qty,
        subtotal,
      };

      set({ items: updatedItems });
    }
  },

  clearCart: () => set({ items: [] }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      const unitPrice = item.product.mrp * item.qty;
      return sum + unitPrice;
    }, 0);
  },

  getTotalTax: () => {
    return get().items.reduce((sum, item) => {
      const taxAmount = (item.product.mrp * item.product.tax_rate / 100) * item.qty;
      return sum + taxAmount;
    }, 0);
  },

  getTotal: () => {
    return get().getSubtotal() + get().getTotalTax();
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.qty, 0);
  },
    }),
    {
      name: 'zerocue-cart', // Storage key
      partialize: (state) => ({
        items: state.items,
        selectedStore: state.selectedStore,
      }),
    }
  )
);
