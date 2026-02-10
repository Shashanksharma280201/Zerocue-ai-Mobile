import { create } from 'zustand';

export interface ReservationItem {
  id: string;
  productId: string;
  productName: string;
  brand: string;
  price: number;
  size: string;
  color: string;
  reservedAt: string;
  expiresAt: string;
}

interface ReservationStore {
  reservations: ReservationItem[];
  addReservation: (item: Omit<ReservationItem, 'id' | 'reservedAt' | 'expiresAt'>) => void;
  removeReservation: (id: string) => void;
  clearReservations: () => void;
}

export const useReservationStore = create<ReservationStore>((set) => ({
  reservations: [],

  addReservation: (item) => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    const newReservation: ReservationItem = {
      ...item,
      id: `res_${Date.now()}`,
      reservedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    set((state) => ({
      reservations: [newReservation, ...state.reservations],
    }));
  },

  removeReservation: (id) =>
    set((state) => ({
      reservations: state.reservations.filter((r) => r.id !== id),
    })),

  clearReservations: () => set({ reservations: [] }),
}));
