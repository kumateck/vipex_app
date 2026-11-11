import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { AppState } from 'react-native';

/** Keeps active queue boards aligned with the current day and app session. */
export function usePickupQueueRefresh(refresh: () => Promise<void>) {
  useFocusEffect(
    useCallback(() => {
      void refresh();
      let midnightTimer: ReturnType<typeof setTimeout>;
      const scheduleNextDayRefresh = () => {
        const now = new Date();
        const nextDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
        midnightTimer = setTimeout(
          () => {
            scheduleNextDayRefresh();
            void refresh();
          },
          nextDay - now.getTime() + 50,
        );
      };
      scheduleNextDayRefresh();
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') void refresh();
      });
      return () => {
        clearTimeout(midnightTimer);
        subscription.remove();
      };
    }, [refresh]),
  );
}
