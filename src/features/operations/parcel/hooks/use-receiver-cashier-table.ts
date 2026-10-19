import { useCallback, useEffect, useState } from 'react';
import { ParcelStatus } from '@/db/schemas/enums';
import type { ParcelReceiverQuery } from '../types';
import { getQueueFilterBySearch } from '../components/parcel-receiver-cashier/receiver-cashier-utils';

export function useReceiverCashierTable({
  companyId,
  branchId,
  isPickupQueueEnabled,
}: {
  companyId: string | null;
  branchId: string | null;
  isPickupQueueEnabled: boolean;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState<number>(ParcelStatus.AWAITING_PICKUP);
  const isDelivered = status === ParcelStatus.DELIVERED_BY_OFFICE;
  const filtersFor = useCallback(
    (search?: string) => ({
      companyId,
      destinationId: branchId,
      status,
      cashierCollectionRequired: isDelivered ? undefined : true,
      hasPickupQueue: isDelivered
        ? undefined
        : getQueueFilterBySearch(isPickupQueueEnabled, search),
    }),
    [companyId, branchId, status, isDelivered, isPickupQueueEnabled],
  );
  const sort = useCallback(
    () =>
      isDelivered
        ? [
            { field: 'createdAt', direction: 'desc' as const },
            { field: 'id', direction: 'desc' as const },
          ]
        : [{ field: 'pickupQueueNumber', direction: 'asc' as const }],
    [isDelivered],
  );
  const [query, setQuery] = useState<ParcelReceiverQuery>(() => ({
    page: 1,
    pageSize: 20,
    sort: sort(),
    filters: filtersFor(),
  }));
  useEffect(() => {
    setQuery((prev) => ({ ...prev, page: 1, sort: sort(), filters: filtersFor(prev.search) }));
  }, [filtersFor, sort]);
  const handleSearchSubmit = useCallback(() => {
    const search = searchInput.trim() || undefined;
    setQuery((prev) => ({ ...prev, page: 1, search, sort: sort(), filters: filtersFor(search) }));
  }, [searchInput, sort, filtersFor]);
  const handleRequestChange = useCallback(
    (next: Partial<ParcelReceiverQuery>) => {
      setQuery((prev) => ({
        ...prev,
        ...next,
        search: prev.search,
        sort: isDelivered || isPickupQueueEnabled ? sort() : next.sort,
        filters: filtersFor(prev.search),
      }));
    },
    [filtersFor, isDelivered, isPickupQueueEnabled, sort],
  );
  return {
    query,
    setQuery,
    searchInput,
    setSearchInput,
    status,
    setStatus,
    isDelivered,
    handleSearchSubmit,
    handleRequestChange,
  };
}
