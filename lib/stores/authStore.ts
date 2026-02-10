import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../supabase';
import { UserProfile } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Store {
  id: string;
  name: string;
  address?: string;
  geo?: { lat: number; lng: number };
}

interface AuthState {
  user: UserProfile | null;
  session: any;
  loading: boolean;
  initialized: boolean;
  currentStore: Store | null;

  setUser: (user: UserProfile | null) => void;
  setSession: (session: any) => void;
  setCurrentStore: (store: Store | null) => void;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      initialized: false,
      currentStore: null,

      setUser: (user) => set({ user }),

      setSession: (session) => set({ session }),

      setCurrentStore: (store) => set({ currentStore: store }),

      updateUser: async (updates) => {
        const currentUser = get().user;
        if (!currentUser) throw new Error('No user logged in');

        // TODO: Call API to update user profile in database
        // For now, we'll just update the local state
        const updatedUser = { ...currentUser, ...updates };
        set({ user: updatedUser });
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null, currentStore: null });
      },

      initialize: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            // Fetch user profile
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            set({
              user: profile,
              session,
              loading: false,
              initialized: true
            });
          } else {
            set({
              user: null,
              session: null,
              loading: false,
              initialized: true
            });
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
          set({ loading: false, initialized: true });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ currentStore: state.currentStore }), // Only persist store selection
    }
  )
);

// Listen to auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state changed:', event);

  if (event === 'SIGNED_IN' && session?.user) {
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    useAuthStore.setState({ user: profile, session });
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, session: null });
  }
});
