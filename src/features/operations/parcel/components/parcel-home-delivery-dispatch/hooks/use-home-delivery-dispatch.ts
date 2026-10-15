import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import { ParcelStatus } from '@/db/schemas/enums';
import type { ServerListQuery } from '@/services/rtk-query';
import type { PaginationRequestDto } from '@/server/types/pagination.types';
import { useAuthStore } from '@/stores/auth-store';
import { useHomeDeliveryPickup } from '../../../home-delivery-pickup';
import {
  type ParcelSearchRow,
  type HomeDeliveryReceipt,
  useDispatchDoorstepParcelsMutation,
  useLazyGetHomeDeliveryReceiptQuery,
  useSearchParcelsQuery,
} from '../../../api/parcel.api';

export function useHomeDeliveryDispatch() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;
  const userId = user?.id ?? '';
  const [searchInput, setSearchInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [riderUserId, setRiderUserId] = useState('');
  const [printData, setPrintData] = useState<HomeDeliveryReceipt | null>(null);
  const [query, setQuery] = useState<
    ServerListQuery<{
      companyId?: string | null;
      destinationId?: string | null;
      statuses?: number[] | null;
    }>
  >({
    page: 1,
    pageSize: 20,
    filters: {
      companyId,
      destinationId: branchId,
      statuses: [ParcelStatus.ADDRESS_COLLECTED],
    },
  });
  const listQuery = useSearchParcelsQuery(query, { skip: !companyId || !branchId });
  const [dispatchBulk, { isLoading: isDispatching }] = useDispatchDoorstepParcelsMutation();
  const { onReturnToPickup: returnToPickup, isReturningToPickup } = useHomeDeliveryPickup();
  const [loadReceipt, { isFetching: isLoadingReceipt }] = useLazyGetHomeDeliveryReceiptQuery();

  const { data: riderOptions = [] } = useListUserOptionsQuery(
    companyId && branchId ? { companyId, branchId, userType: 2 } : undefined,
    { skip: !companyId || !branchId },
  );

  useEffect(() => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      filters: {
        companyId,
        destinationId: branchId,
        statuses: [ParcelStatus.ADDRESS_COLLECTED],
      },
    }));
  }, [companyId, branchId]);

  const onReturnToPickup = useCallback(
    async (parcel: ParcelSearchRow) => {
      if (await returnToPickup(parcel)) {
        setSelectedIds((prev) => prev.filter((id) => id !== parcel.id));
      }
    },
    [returnToPickup],
  );

  const onPrint = useCallback(
    async (parcel: ParcelSearchRow) => {
      try {
        const receipt = await loadReceipt(parcel.id).unwrap();
        setPrintData(receipt);
      } catch (error) {
        toast.error(
          getApplicationErrorMessage(error, '') || 'Failed to load home delivery receipt',
        );
      }
    },
    [loadReceipt],
  );

  const onDispatch = async () => {
    if (!riderUserId) {
      toast.error('Select rider');
      return;
    }
    if (!selectedIds.length) {
      toast.error('Select parcels to dispatch');
      return;
    }
    try {
      const result = await dispatchBulk({
        parcelIds: selectedIds,
        riderUserId,
        userId,
      }).unwrap();
      toast.success(`Dispatched ${result.updated} parcel(s)`);
      setSelectedIds([]);
      await listQuery.refetch();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to dispatch');
    }
  };

  const onSearch = () => {
    const term = searchInput.trim();
    setQuery((prev) => ({ ...prev, page: 1, search: term.length ? term : undefined }));
  };
  const onRequestChange = (
    next: PaginationRequestDto<{
      companyId?: string | null;
      destinationId?: string | null;
      statuses?: number[] | null;
    }>,
  ) =>
    setQuery((prev) => ({
      ...prev,
      ...next,
      search: prev.search,
      filters: { companyId, destinationId: branchId, statuses: [ParcelStatus.ADDRESS_COLLECTED] },
    }));
  return {
    companyId,
    branchId,
    searchInput,
    setSearchInput,
    selectedIds,
    setSelectedIds,
    riderUserId,
    setRiderUserId,
    printData,
    listQuery,
    isDispatching,
    isReturningToPickup,
    riderOptions,
    onReturnToPickup,
    onPrint,
    onDispatch,
    onSearch,
    onRequestChange,
    isPrinting: isLoadingReceipt || printData !== null,
    onPrintComplete: () => setPrintData(null),
  };
}
