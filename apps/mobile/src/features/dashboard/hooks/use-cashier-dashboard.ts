import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  canCloseCashierSessions,
  canOpenCashierSessions,
  canReadCashierSessionTypes,
  canViewCashierSalesReport,
  canViewCashierSessions,
} from '@mobile/lib/permissions';
import { useAuth } from '@mobile/providers/auth-provider';
import { getCashierDashboard } from '../services';
import type { CashierDashboardData, CashierDashboardState } from '../types';
import { cashierSummaryMode } from '../utils';

const EMPTY_DATA: CashierDashboardData = {
  activeSession: null,
  activeSummary: null,
};

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.toLowerCase().includes('network')) {
    return 'Could not reach VIPEx. Check your connection and try again.';
  }
  return error instanceof Error
    ? error.message.replace(/\s*\(\d{3}\)$/, '')
    : 'Dashboard data could not be loaded.';
}

export function useCashierDashboard(): CashierDashboardState {
  const { session, withAuth } = useAuth();
  const permissions = session.user?.permissions;
  const cashierId = session.user?.id ?? session.user?.sub ?? '';
  const cashierType = session.user?.cashierType ?? null;
  const summaryMode = cashierSummaryMode(cashierType);
  const access = {
    sessions: canViewCashierSessions(permissions),
    sessionTypes: canReadCashierSessionTypes(permissions),
    openSession: canOpenCashierSessions(permissions),
    closeSession: canCloseCashierSessions(permissions),
    report: canViewCashierSalesReport(permissions),
  };
  const [data, setData] = useState<CashierDashboardData>(EMPTY_DATA);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(
    async (isRefresh: boolean) => {
      if (!cashierId || !access.sessions) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const currentRequest = ++requestId.current;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const next = await withAuth((accessToken) =>
          getCashierDashboard({ access, accessToken, summaryMode }),
        );
        if (currentRequest === requestId.current) setData(next);
      } catch (loadError) {
        if (currentRequest === requestId.current) setError(errorMessage(loadError));
      } finally {
        if (currentRequest === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [access.sessions, cashierId, summaryMode, withAuth],
  );

  useFocusEffect(
    useCallback(() => {
      void load(false);
      return () => {
        requestId.current += 1;
      };
    }, [load]),
  );

  const refresh = useCallback(() => void load(true), [load]);

  return { access, cashierType, data, error, loading, refreshing, refresh };
}
