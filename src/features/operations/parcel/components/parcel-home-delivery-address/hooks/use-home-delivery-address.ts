import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { ParcelStatus } from '@/db/schemas/enums';
import type { ServerListQuery } from '@/services/rtk-query';
import type { PaginationRequestDto } from '@/server/types/pagination.types';
import { useAuthStore } from '@/stores/auth-store';
import { useDeliveryChangeReview } from '@/features/operations/delivery-change-requests';
import { useHomeDeliveryPickup } from '../../../home-delivery-pickup';
import {
  type ParcelSearchRow,
  useCollectDoorstepAddressMutation,
  useSearchParcelsQuery,
} from '../../../api/parcel.api';

export function useHomeDeliveryAddress() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;
  const userId = user?.id ?? '';
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState<
    ServerListQuery<{
      companyId?: string | null;
      destinationId?: string | null;
      status?: number | null;
    }>
  >({
    page: 1,
    pageSize: 20,
    filters: { companyId, destinationId: branchId, status: ParcelStatus.HOME_DELIVERY_REQUESTED },
  });
  const [selectedParcel, setSelectedParcel] = useState<ParcelSearchRow | null>(null);
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [collectAddress, { isLoading: isSaving }] = useCollectDoorstepAddressMutation();
  const { onReturnToPickup, isReturningToPickup } = useHomeDeliveryPickup();
  const listQuery = useSearchParcelsQuery(query, { skip: !companyId || !branchId });
  const changeReview = useDeliveryChangeReview();

  useEffect(() => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      filters: { companyId, destinationId: branchId, status: ParcelStatus.HOME_DELIVERY_REQUESTED },
    }));
  }, [companyId, branchId]);

  const onSubmit = async () => {
    if (!selectedParcel) return;
    try {
      await collectAddress({
        parcelId: selectedParcel.id,
        userId,
        dropoffAddress: dropoffAddress.trim(),
        deliveryFeeCedis: selectedParcel.chargeExemptCustomerType != null ? '0' : deliveryFee,
      }).unwrap();
      toast.success('Address and delivery fee saved');
      setSelectedParcel(null);
      await listQuery.refetch();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to save');
    }
  };

  const onCollectAddress = useCallback((parcel: ParcelSearchRow) => {
    setSelectedParcel(parcel);
    setDropoffAddress('');
    setDeliveryFee(parcel.chargeExemptCustomerType != null ? '0' : '');
  }, []);
  const onSearch = () => {
    const term = searchInput.trim();
    setQuery((prev) => ({ ...prev, page: 1, search: term.length ? term : undefined }));
  };
  const onRequestChange = (next: PaginationRequestDto) =>
    setQuery((prev) => ({
      ...prev,
      ...next,
      search: prev.search,
      filters: { companyId, destinationId: branchId, status: ParcelStatus.HOME_DELIVERY_REQUESTED },
    }));
  return {
    companyId,
    branchId,
    searchInput,
    setSearchInput,
    selectedParcel,
    dropoffAddress,
    setDropoffAddress,
    deliveryFee,
    setDeliveryFee,
    isSaving,
    listQuery,
    changeReview,
    onReturnToPickup,
    isReturningToPickup,
    onSubmit,
    onCollectAddress,
    onSearch,
    onRequestChange,
    onClose: () => setSelectedParcel(null),
  };
}
