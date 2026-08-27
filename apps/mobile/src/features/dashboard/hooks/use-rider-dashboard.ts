import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { canViewRiderCurrent } from '@mobile/lib/permissions';
import { useAuth } from '@mobile/providers/auth-provider';
import { getRiderDailyAnalytics } from '../services';
import type { RiderDailyAnalytics, RiderDashboardState } from '../types';
import { subscribeToRiderAssignmentSignals } from '@mobile/features/rider/assignment-realtime';

const EMPTY_ANALYTICS: RiderDailyAnalytics = {
  date: '',
  assignedCount: 0,
  completedCount: 0,
  returnedCount: 0,
  totalAmountReceivedPsw: 0,
  toBePaidReceivedPsw: 0,
  deliveryFeeReceivedPsw: 0,
};

function dashboardErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.toLowerCase().includes('network')) {
    return 'Could not reach VIPEx. Check your connection and try again.';
  }
  return error instanceof Error
    ? error.message.replace(/\s*\(\d{3}\)$/, '')
    : 'Rider analytics could not be loaded.';
}

export function useRiderDashboard(): RiderDashboardState {
  const { session, withAuth } = useAuth();
  const canView = canViewRiderCurrent(session.user?.permissions);
  const riderId = session.user?.id ?? session.user?.sub ?? '';
  const [data, setData] = useState(EMPTY_ANALYTICS);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(
    async (isRefresh: boolean) => {
      if (!canView || !riderId) {
        setLoading(false);
        return;
      }
      const currentRequest = ++requestId.current;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const next = await withAuth(getRiderDailyAnalytics);
        if (currentRequest === requestId.current) setData(next);
      } catch (loadError) {
        if (currentRequest === requestId.current) setError(dashboardErrorMessage(loadError));
      } finally {
        if (currentRequest === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [canView, riderId, withAuth],
  );

  useFocusEffect(
    useCallback(() => {
      void load(false);
      return () => {
        requestId.current += 1;
      };
    }, [load]),
  );

  useEffect(() => subscribeToRiderAssignmentSignals(() => void load(true)), [load]);

  return { canView, data, error, loading, refreshing, refresh: () => void load(true) };
}
