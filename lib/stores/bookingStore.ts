import { create } from 'zustand';
import { Booking, BookingItem, Product, Store } from '../types';

interface BookingStore {
  bookings: Booking[];
  currentBooking: BookingItem[];
  currentStore: Store | null;

  // Actions
  setCurrentStore: (store: Store | null) => void;
  addToBooking: (product: Product, qty: number) => void;
  removeFromBooking: (productId: string) => void;
  updateBookingQty: (productId: string, qty: number) => void;
  clearCurrentBooking: () => void;

  createBooking: (userId: string) => void;
  cancelBooking: (bookingId: string) => void;
  markAsPickedUp: (bookingId: string) => void;
  checkExpiredBookings: () => void;

  getActiveBookings: () => Booking[];
  getBookingTotal: () => number;
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  bookings: [],
  currentBooking: [],
  currentStore: null,

  setCurrentStore: (store) => set({ currentStore: store }),

  addToBooking: (product, qty) => {
    const { currentBooking } = get();
    const existing = currentBooking.find(item => item.product.id === product.id);

    if (existing) {
      set({
        currentBooking: currentBooking.map(item =>
          item.product.id === product.id
            ? { ...item, qty: item.qty + qty }
            : item
        ),
      });
    } else {
      set({
        currentBooking: [
          ...currentBooking,
          {
            id: `booking-item-${Date.now()}`,
            product,
            qty,
            unit_price: product.mrp,
          },
        ],
      });
    }
  },

  removeFromBooking: (productId) => {
    set(state => ({
      currentBooking: state.currentBooking.filter(
        item => item.product.id !== productId
      ),
    }));
  },

  updateBookingQty: (productId, qty) => {
    if (qty <= 0) {
      get().removeFromBooking(productId);
      return;
    }

    set(state => ({
      currentBooking: state.currentBooking.map(item =>
        item.product.id === productId ? { ...item, qty } : item
      ),
    }));
  },

  clearCurrentBooking: () => {
    set({ currentBooking: [], currentStore: null });
  },

  createBooking: (userId) => {
    const { currentBooking, currentStore, bookings } = get();

    if (currentBooking.length === 0 || !currentStore) {
      return;
    }

    const total = currentBooking.reduce(
      (sum, item) => sum + item.unit_price * item.qty,
      0
    );

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 6); // 6 hours from now

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      user_id: userId,
      store_id: currentStore.id,
      store: currentStore,
      items: currentBooking,
      total,
      status: 'active',
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    };

    set({
      bookings: [newBooking, ...bookings],
      currentBooking: [],
      currentStore: null,
    });
  },

  cancelBooking: (bookingId) => {
    set(state => ({
      bookings: state.bookings.map(booking =>
        booking.id === bookingId
          ? { ...booking, status: 'cancelled' }
          : booking
      ),
    }));
  },

  markAsPickedUp: (bookingId) => {
    set(state => ({
      bookings: state.bookings.map(booking =>
        booking.id === bookingId
          ? {
              ...booking,
              status: 'picked_up',
              picked_up_at: new Date().toISOString(),
            }
          : booking
      ),
    }));
  },

  checkExpiredBookings: () => {
    const now = new Date();
    set(state => ({
      bookings: state.bookings.map(booking => {
        if (
          booking.status === 'active' &&
          new Date(booking.expires_at) < now
        ) {
          return { ...booking, status: 'expired' };
        }
        return booking;
      }),
    }));
  },

  getActiveBookings: () => {
    return get().bookings.filter(b => b.status === 'active');
  },

  getBookingTotal: () => {
    const { currentBooking } = get();
    return currentBooking.reduce(
      (sum, item) => sum + item.unit_price * item.qty,
      0
    );
  },
}));
