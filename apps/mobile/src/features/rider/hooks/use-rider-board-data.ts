import { useCallback, useEffect, useMemo, useState } from 'react';
import { listRiderParcels } from '@mobile/lib/api';
import { notifyError } from '@mobile/lib/notify';
import { useAuth } from '@mobile/providers/auth-provider';
import {
  canCompleteRiderDeliveryActions,
  canViewRiderCurrent,
  canViewRiderHistory,
} from '@mobile/lib/permissions';
import { hapticError } from '@mobile/lib/haptics';
import type { RiderDoorstepRecord } from '@mobile/types/parcels';
import { getRiderDailyAnalytics } from '@mobile/features/dashboard/services';
import type { RiderDailyAnalytics } from '@mobile/features/dashboard/types';
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

export function formatCedisFromPsw(amountPsw?: number) {
  const cedis = (amountPsw ?? 0) / 100;
  return `GH₵ ${cedis.toFixed(2)}`;
}

export function toDateKey(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayDateKey() {
  return toDateKey(new Date().toISOString()) ?? '';
}

export function shiftDateKey(dateKey: string, diff: number) {
  const parsed = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateKey;
  parsed.setDate(parsed.getDate() + diff);
  return toDateKey(parsed.toISOString()) ?? dateKey;
}

export function isReturnedStatus(status?: string | null) {
  const normalized = (status ?? '').toLowerCase();
  return normalized.includes('return');
}

export function isCompletedStatus(status?: string | null) {
  const normalized = (status ?? '').toLowerCase();
  if (isReturnedStatus(normalized)) return false;
  return (
    normalized.includes('deliver') ||
    normalized.includes('given') ||
    normalized.includes('success') ||
    normalized.includes('complete')
  );
}

export function doorstepToParcelRow(row: RiderDoorstepRecord) {
  return {
    bookingCode: row.bookingCode,
    parcelDetails: row.parcelDetails,
    receiverName: row.receiverName ?? null,
    receiverPhone: row.receiverPhone ?? null,
    senderName: null,
    senderPhone: null,
    status: row.deliveryStatus,
    isDeleted: false,
  };
}

export function useRiderBoardData(selectedDate: string, view: 'current' | 'history' = 'current') {
  const { session, withAuth } = useAuth();
  const permissions = session.user?.permissions ?? [];
  const canReadCurrent = canViewRiderCurrent(permissions);
  const canReadHistory = canViewRiderHistory(permissions);
  const canView = view === 'current' ? canReadCurrent : canReadHistory;
  const canCompleteDelivery = canCompleteRiderDeliveryActions(permissions);
  const riderUserId = session.user?.id ?? session.user?.sub;

  const [currentRows, setCurrentRows] = useState<RiderDoorstepRecord[]>([]);
  const [historyRows, setHistoryRows] = useState<RiderDoorstepRecord[]>([]);
  const [dailyAnalytics, setDailyAnalytics] = useState(EMPTY_ANALYTICS);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!riderUserId || !canView) return;
    setRefreshing(true);
    try {
      const [current, history, analytics] = await withAuth((token) =>
        Promise.all([
          canReadCurrent
            ? listRiderParcels(token, riderUserId, 'current')
            : Promise.resolve({ rows: [] as RiderDoorstepRecord[] }),
          canReadHistory
            ? listRiderParcels(token, riderUserId, 'history')
            : Promise.resolve({ rows: [] as RiderDoorstepRecord[] }),
          canReadCurrent
            ? getRiderDailyAnalytics(token, selectedDate || todayDateKey())
            : Promise.resolve(EMPTY_ANALYTICS),
        ]),
      );
      setCurrentRows(current.rows ?? []);
      setHistoryRows(history.rows ?? []);
      setDailyAnalytics(analytics);
    } catch (err) {
      notifyError(
        'Load failed',
        err instanceof Error ? err.message : 'Unable to load rider parcels',
      );
      void hapticError();
    } finally {
      setRefreshing(false);
    }
  }, [canReadCurrent, canReadHistory, canView, riderUserId, selectedDate, withAuth]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => subscribeToRiderAssignmentSignals(() => void load()), [load]);

  const currentParcelIdSet = useMemo(
    () => new Set(currentRows.map((row) => row.parcelId)),
    [currentRows],
  );

  return {
    canView,
    canCompleteDelivery,
    riderUserId,
    currentRows,
    historyRows,
    refreshing,
    load,
    currentParcelIdSet,
    dailyAnalytics,
  };
}
