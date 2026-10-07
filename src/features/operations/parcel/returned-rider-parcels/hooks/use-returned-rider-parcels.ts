import { useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useAuthStore } from '@/stores/auth-store';
import type { ParcelSearchRow } from '../../api/parcel.api';
import {
  useListReturnedRiderParcelsQuery,
  useListReturnRedispatchRidersQuery,
  useReprocessRiderReturnForPickupMutation,
  useRedispatchRiderReturnMutation,
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
  const list = useListReturnedRiderParcelsQuery(
    { page, pageSize: 20, search: search || undefined },
    { skip: !companyId || !branchId },
  );
  const { data: riders = [] } = useListReturnRedispatchRidersQuery(undefined, {
    skip: !companyId || !branchId,
  });
  const [dispatch] = useRedispatchRiderReturnMutation();
  const [moveToPickup] = useReprocessRiderReturnForPickupMutation();

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
    } catch (error) {
      toast.error(getErrorMessage(error, '') || 'Failed to reprocess parcel');
    } finally {
      setBusyParcelId(null);
    }
  }

  return {
    rows: list.data?.data ?? [],
    meta: list.data?.meta,
    isFetching: list.isFetching,
    error: list.error,
    searchInput,
    setSearchInput,
    submitSearch: () => {
      setSearch(searchInput.trim());
      setPage(1);
    },
    page,
    setPage,
    riders,
    riderUserId,
    setRiderUserId,
    busyParcelId,
    reprocess,
  };
}
