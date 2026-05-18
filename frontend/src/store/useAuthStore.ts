import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email?: string;
  packsAvailable: number;
  level?: number;
  xp?: number;
  lastPackClaimedAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUserStats: (level: number, xp: number) => void;
  updatePacksAvailable: (packs: number, lastPackClaimedAt?: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),

      updateUserStats: (level, xp) =>
        set((state) => ({
          user: state.user ? { ...state.user, level, xp } : null,
        })),

      updatePacksAvailable: (packs, lastPackClaimedAt) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                packsAvailable: packs,
                lastPackClaimedAt: lastPackClaimedAt !== undefined ? lastPackClaimedAt : state.user.lastPackClaimedAt
              }
            : null,
        })),
    }),
    {
      name: 'pokemon-tcg-auth', // clave en localStorage
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
