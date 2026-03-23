import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { BranchType, UserType } from '@/shared/access/constants';

export interface AuthUser {
  id: string;
  fullname: string;
  email: string;
  telephone?: string;
  company: {
    id: string;
    name: string;
    useAccounting: boolean;
  } | null;
  branch: { id: string; name: string; type?: BranchType } | null;
  role: { id: string; name: string } | null;
  permissions: string[];
  userType?: UserType;
  location?: { id: string; name: string } | null;
  locationId?: string;
  locationName?: string;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (payload: { user: AuthUser; accessToken: string; refreshToken: string }) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      updateUser: (patch) =>
        set((state) => (state.user ? { user: { ...state.user, ...patch } } : state)),
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    { name: 'vipex-auth-storage' },
  ),
);
