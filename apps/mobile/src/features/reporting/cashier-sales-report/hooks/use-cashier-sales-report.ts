import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { canViewCashierSalesReport } from '@mobile/lib/permissions';
import { useAuth } from '@mobile/providers/auth-provider';
import { getCashierSalesReport } from '../services';
import type { CashierSalesReport, CashierSalesReportState } from '../types';
import { normalizeDateKey } from '../utils';

function reportErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.toLowerCase().includes('network')) {
    return 'Could not reach VIPEx. Check your connection and try again.';
  }
  return error instanceof Error
    ? error.message.replace(/\s*\(\d{3}\)$/, '')
    : 'The cashier report could not be loaded.';
}

export function useCashierSalesReport(initialDate?: string): CashierSalesReportState {
  const { session, withAuth } = useAuth();
  const user = session.user;
  const canView = canViewCashierSalesReport(user?.permissions);
  const cashierUserId = user?.id ?? user?.sub ?? '';
  const [selectedDate, setSelectedDate] = useState(() => normalizeDateKey(initialDate));
  const [appliedDate, setAppliedDate] = useState(() => normalizeDateKey(initialDate));
  const [report, setReport] = useState<CashierSalesReport | null>(null);
  const [tab, setTab] = useState<CashierSalesReportState['tab']>('payments');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(
    async (isRefresh: boolean) => {
      if (!canView || !cashierUserId) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const currentRequest = ++requestId.current;
      if (isRefresh) setRefreshing(true);
      else {
        setLoading(true);
        setReport(null);
      }
      setError(null);
      try {
        const result = await withAuth((accessToken) =>
          getCashierSalesReport({
            accessToken,
            date: appliedDate,
            cashierUserId,
            cashierType: user?.cashierType,
            locationId: user?.location?.id,
          }),
        );
        if (currentRequest === requestId.current) setReport(result);
      } catch (loadError) {
        if (currentRequest === requestId.current) setError(reportErrorMessage(loadError));
      } finally {
        if (currentRequest === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [appliedDate, canView, cashierUserId, user?.cashierType, user?.location?.id, withAuth],
  );

  useFocusEffect(
    useCallback(() => {
      void load(false);
      return () => {
        requestId.current += 1;
      };
    }, [load]),
  );

  return {
    canView,
    selectedDate,
    appliedDate,
    report,
    tab,
    loading,
    refreshing,
    error,
    setTab,
    setSelectedDate,
    hasPendingDate: selectedDate !== appliedDate,
    loadReport: () => setAppliedDate(selectedDate),
    refresh: () => void load(true),
  };
}
