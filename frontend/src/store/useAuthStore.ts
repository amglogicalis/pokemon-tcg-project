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
  completedExpansions?: string[];
  showcasedMedals?: string[];
  activeTheme?: string;
  isGuest?: boolean;
  mustChangePassword?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => Promise<void>;
  updateUserStats: (level: number, xp: number, completedExpansions?: string[]) => void;
  updatePacksAvailable: (packs: number, lastPackClaimedAt?: string) => void;
  updateActiveTheme: (theme: string) => void;
  updateUser: (updatedFields: Partial<User>) => void;
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

      logout: async () => {
        try {
          // Llamar al endpoint de logout real para invalidar el token en el servidor
          const token = useAuthStore.getState().token;
          await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/logout`, {
            method: 'POST',
            credentials: 'include', // envía la cookie httpOnly si existe
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
        } catch (_) {
          // Si falla la llamada al servidor, continuamos con el logout local igualmente
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      updateUserStats: (level, xp, completedExpansions) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                level,
                xp,
                completedExpansions: completedExpansions !== undefined ? completedExpansions : state.user.completedExpansions
              }
            : null,
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

      updateActiveTheme: (theme) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                activeTheme: theme
              }
            : null,
        })),
      updateUser: (updatedFields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedFields } : null,
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
