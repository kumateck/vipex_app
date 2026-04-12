import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SecurityPreferencesState = {
  screenTimeoutByUserId: Record<string, number>;
  setScreenTimeoutMinutes: (userId: string, minutes: number) => void;
  getScreenTimeoutMinutes: (userId: string) => number;
};

export const useSecurityPreferencesStore = create<SecurityPreferencesState>()(
  persist(
    (set, get) => ({
      screenTimeoutByUserId: {},
      setScreenTimeoutMinutes: (userId, minutes) =>
        set((state) => ({
          screenTimeoutByUserId: {
            ...state.screenTimeoutByUserId,
            [userId]: minutes,
          },
        })),
      getScreenTimeoutMinutes: (userId) => get().screenTimeoutByUserId[userId] ?? 0,
    }),
    {
      name: 'vipex-security-preferences-storage',
    },
  ),
);
