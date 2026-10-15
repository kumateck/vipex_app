import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useListParcelStorageClearancesQuery } from '../services';
import type {
  ParcelStorageClearanceRow,
  StorageClearanceMode,
  StorageClearanceAction,
} from '../types';
const APPROVAL_STATUSES = [0];
const FINANCE_STATUSES = [1];
export function useStorageClearanceList(mode: StorageClearanceMode) {
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [detailRow, setDetailRow] = useState<ParcelStorageClearanceRow | null>(null);
  const [resubmitRow, setResubmitRow] = useState<ParcelStorageClearanceRow | null>(null);
  const [action, setAction] = useState<{
    row: ParcelStorageClearanceRow;
    mode: StorageClearanceAction;
  } | null>(null);
  const statuses =
    mode === 'approvals'
      ? APPROVAL_STATUSES
      : mode === 'execution'
        ? FINANCE_STATUSES
        : status === 'all'
          ? undefined
          : [Number(status)];
  const result = useListParcelStorageClearancesQuery(
    { page, pageSize: 20, search: search.trim() || undefined, filters: { statuses } },
    { skip: !user?.company?.id },
  );
  const canRequest =
    user?.permissions.includes(PermissionKeys.CanRequestParcelStorageClearance) ?? false;
  return {
    user,
    search,
    page,
    status,
    detailRow,
    resubmitRow,
    action,
    canRequest,
    result,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(1);
    },
    setStatus: (value: string) => {
      setStatus(value);
      setPage(1);
    },
    setPage,
    showDetails: setDetailRow,
    closeDetails: () => setDetailRow(null),
    review: (row: ParcelStorageClearanceRow) => {
      if (canRequest && row.requestedBy === user?.id) setResubmitRow(row);
    },
    closeReview: () => setResubmitRow(null),
    openAction: (row: ParcelStorageClearanceRow, actionMode: StorageClearanceAction) =>
      setAction({ row, mode: actionMode }),
    closeAction: () => setAction(null),
  };
}
