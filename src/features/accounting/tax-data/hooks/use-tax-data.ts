import { useCallback, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  useGetTaxDataOptionsQuery,
  useLazyGetTaxDataCountsQuery,
  useLazyGetTaxDataRecordsQuery,
} from '../services';
import type { TaxDataFilters } from '../types';
import { useTaxDataFilters } from './use-tax-data-filters';
import { useTaxDataSelection } from './use-tax-data-selection';

export function useTaxData() {
  const user = useAuthStore((state) => state.user);
  const allowed = Boolean(user?.permissions.includes(PermissionKeys.CanReadAccounting));
  const canConfirm = Boolean(user?.permissions.includes(PermissionKeys.CanConfirmParcelTaxData));
  const viewerKey = `${user?.id}:${user?.company?.id}:${user?.branch?.id}:${user?.branch?.type}`;
  const draft = useTaxDataFilters(user);
  const selection = useTaxDataSelection(viewerKey);
  const options = useGetTaxDataOptionsQuery(viewerKey, { skip: !allowed || !user?.company?.id });
  const [loadCounts, countsResult] = useLazyGetTaxDataCountsQuery();
  const [loadRecords, recordsResult] = useLazyGetTaxDataRecordsQuery();
  const [applied, setApplied] = useState<{
    owner: string;
    filters: TaxDataFilters;
    limit: number;
    showRecords: boolean;
  } | null>(null);
  const scope = applied?.owner === viewerKey ? applied : null;
  const counts =
    scope && countsResult.originalArgs?.viewerKey === viewerKey
      ? countsResult.currentData
      : undefined;
  const records =
    scope?.showRecords && recordsResult.originalArgs?.viewerKey === viewerKey
      ? recordsResult.currentData
      : undefined;
  const canLoad = allowed && draft.valid && !options.isError;
  const canGetData = canLoad && draft.recordsValid;
  const busy = countsResult.isFetching || recordsResult.isFetching;
  const apply = useCallback(
    (mode: 'counts' | 'records') => {
      if (!canLoad || busy || (mode === 'records' && !canGetData)) return;
      draft.setOpen(false);
      const filters = {
        ...draft.filters,
        amountPsw: mode === 'records' ? draft.filters.amountPsw : undefined,
        maxOccurrences: draft.filters.maxOccurrences ?? 50,
      };
      setApplied({
        owner: viewerKey,
        filters,
        limit: draft.limit,
        showRecords: mode === 'records',
      });
      void loadCounts({ ...filters, viewerKey });
      if (mode === 'records')
        void loadRecords({ ...filters, viewerKey, page: 1, limit: draft.limit });
    },
    [canLoad, canGetData, busy, draft, viewerKey, loadCounts, loadRecords],
  );
  const loadPage = useCallback(
    (page: number) => {
      if (!scope) return;
      void loadRecords({ ...scope.filters, viewerKey, page, limit: scope.limit });
    },
    [scope, viewerKey, loadRecords],
  );
  const loadAmount = useCallback(
    (amountPsw: number) => {
      if (!scope || draft.maxInvalid) return;
      const filters = { ...scope.filters, amountPsw, maxOccurrences: draft.filters.maxOccurrences };
      draft.setAmount((amountPsw / 100).toFixed(2));
      setApplied({ ...scope, filters, limit: draft.limit, showRecords: true });
      void loadRecords({ ...filters, viewerKey, page: 1, limit: draft.limit });
    },
    [scope, draft, viewerKey, loadRecords],
  );
  const refresh = useCallback(() => {
    if (!scope) return;
    void loadCounts({ ...scope.filters, viewerKey });
    if (scope.showRecords)
      void loadRecords({ ...scope.filters, viewerKey, page: 1, limit: scope.limit });
  }, [scope, viewerKey, loadCounts, loadRecords]);
  const branches = options.currentData?.fromBranches ?? [];
  const destinations = options.currentData?.toBranches ?? [];
  const scopeName = scope?.filters.branchId
    ? (branches.find((branch) => branch.id === scope.filters.branchId)?.name ?? 'Selected branch')
    : 'All source branches';
  const destinationName = scope?.filters.destinationBranchId
    ? (destinations.find((branch) => branch.id === scope.filters.destinationBranchId)?.name ??
      'Selected destination')
    : 'All destinations';
  return {
    allowed,
    canConfirm,
    viewerKey,
    draft,
    selection,
    branches,
    destinations,
    scope,
    scopeName: `${scopeName} → ${destinationName}`,
    canLoad,
    canGetData,
    busy,
    counts,
    records,
    apply,
    loadPage,
    loadAmount,
    refresh,
    optionsError: options.isError,
    retryOptions: options.refetch,
    countsError: countsResult.isError,
    recordsError: recordsResult.isError,
    countsLoading: countsResult.isFetching,
    recordsLoading: recordsResult.isFetching,
  };
}
