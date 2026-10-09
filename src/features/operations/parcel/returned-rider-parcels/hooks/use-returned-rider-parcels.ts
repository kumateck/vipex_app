import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useAuthStore } from '@/stores/auth-store';
import type { ParcelSearchRow } from '../../api/parcel.api';
import {
  useListReturnedRiderParcelsQuery,
  useListReturnRedispatchRidersQuery,
  useReprocessRiderReturnForPickupMutation,
  useRedispatchRiderReturnMutation,
  useRedispatchRiderReturnsBulkMutation,
} from '../services';

export function useReturnedRiderParcels() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id;
  const branchId = user?.branch?.id;
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [riderUserId, setRiderUserId] = useState('');
  const [busyParcelId, setBusyParcelId] = useState<string | null>(null);
  const [selectedParcelIds, setSelectedParcelIds] = useState<string[]>([]);
  const list = useListReturnedRiderParcelsQuery(
    { page, pageSize: 20, search: search || undefined },
    { skip: !companyId || !branchId },
  );
  const { data: riders = [] } = useListReturnRedispatchRidersQuery(undefined, {
    skip: !companyId || !branchId,
  });
  const [dispatch] = useRedispatchRiderReturnMutation();
  const [dispatchBulk, { isLoading: isBulkRedispatching }] =
    useRedispatchRiderReturnsBulkMutation();
  const [moveToPickup] = useReprocessRiderReturnForPickupMutation();

  const rows = useMemo(() => list.data?.data ?? [], [list.data]);
  const selectedRows = useMemo(
    () => rows.filter((row) => selectedParcelIds.includes(row.id)),
    [rows, selectedParcelIds],
  );

  function dropSelection(parcelId: string) {
    setSelectedParcelIds((current) => current.filter((id) => id !== parcelId));
  }

  async function reprocess(row: ParcelSearchRow, action: 'pickup' | 'redispatch') {
    if (action === 'redispatch' && !riderUserId) {
      toast.error('Select a rider before redispatching');
      return;
    }
    setBusyParcelId(row.id);
    try {
      if (action === 'pickup') {
        await moveToPickup(row.id).unwrap();
        toast.success('Parcel moved to Awaiting Pickup');
      } else {
        await dispatch({ parcelId: row.id, riderUserId }).unwrap();
        toast.success('Parcel redispatched to rider');
      }
      dropSelection(row.id);
    } catch (error) {
      toast.error(getErrorMessage(error, '') || 'Failed to reprocess parcel');
    } finally {
      setBusyParcelId(null);
    }
  }

  function toggleParcelSelected(parcelId: string, selected: boolean) {
    setSelectedParcelIds((current) =>
      selected
        ? current.includes(parcelId)
          ? current
          : [...current, parcelId]
        : current.filter((id) => id !== parcelId),
    );
  }

  function setPageSelected(selected: boolean) {
    const pageIds = rows.map((row) => row.id);
    setSelectedParcelIds((current) =>
      selected
        ? [...new Set([...current, ...pageIds])]
        : current.filter((id) => !pageIds.includes(id)),
    );
  }

  async function bulkRedispatch() {
    if (isBulkRedispatching || selectedRows.length === 0) return;
    if (!riderUserId) {
      toast.error('Select a rider before redispatching');
      return;
    }
    try {
      const result = await dispatchBulk({
        parcelIds: selectedRows.map((row) => row.id),
        riderUserId,
      }).unwrap();
      const succeeded = result.succeeded.length;
      const failed = result.failed;
      if (failed.length === 0) {
        toast.success(`Redispatched ${succeeded} parcel(s) to rider`);
      } else if (succeeded === 0) {
        toast.error(failed[0]?.message || 'Failed to redispatch parcels');
      } else {
        toast.warning(
          `Redispatched ${succeeded} of ${succeeded + failed.length} parcel(s); ${failed.length} failed`,
        );
      }
      setSelectedParcelIds(failed.map((item) => item.parcelId));
    } catch (error) {
      toast.error(getErrorMessage(error, '') || 'Failed to redispatch parcels');
    }
  }

  return {
    rows,
    meta: list.data?.meta,
    isFetching: list.isFetching,
    error: list.error,
    searchInput,
    setSearchInput,
    submitSearch: () => {
      setSelectedParcelIds([]);
      setSearch(searchInput.trim());
      setPage(1);
    },
    page,
    setPage: (nextPage: number) => {
      setSelectedParcelIds([]);
      setPage(nextPage);
    },
    riders,
    riderUserId,
    setRiderUserId,
    busyParcelId,
    reprocess,
    selectedParcelIds,
    toggleParcelSelected,
    setPageSelected,
    clearSelection: () => setSelectedParcelIds([]),
    bulkRedispatch,
    isBulkRedispatching,
  };
}
