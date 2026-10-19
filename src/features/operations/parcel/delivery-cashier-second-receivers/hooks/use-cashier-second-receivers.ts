import { useCallback, useState } from 'react';
import { PermissionKeys } from '@/shared/permissions/constants';
import { ParcelStatus } from '@/db/schemas/enums';
import { useAuthStore } from '@/stores/auth-store';
import type { PaginationRequestDto } from '@/server/types/pagination.types';
import { useSearchParcelsQuery } from '../../api/parcel.api';
import { useParcelSecondReceiver } from '../../hooks';

const statuses = [ParcelStatus.ADDRESS_COLLECTED, ParcelStatus.DISPATCHED];
type CashierFilters = { companyId?: string; destinationId?: string; statuses: number[] };

export function useCashierSecondReceivers() {
  const user = useAuthStore((state) => state.user);
  const canManage = (user?.permissions ?? []).includes(
    PermissionKeys.CanManageParcelSecondReceiver,
  );
  const [request, setRequest] = useState<PaginationRequestDto<CashierFilters>>({
    page: 1,
    pageSize: 10,
  });
  const [search, setSearch] = useState('');
  const filters = { companyId: user?.company?.id, destinationId: user?.branch?.id, statuses };
  const list = useSearchParcelsQuery(
    { ...request, filters },
    {
      skip: !canManage || !filters.companyId || !filters.destinationId,
    },
  );
  const refresh = useCallback(() => {
    void list.refetch();
  }, [list.refetch]);
  const secondReceiver = useParcelSecondReceiver(refresh);
  const submitSearch = useCallback(() => {
    setRequest((previous) => ({ ...previous, page: 1, search: search.trim() || undefined }));
  }, [search]);
  const onRequestChange = useCallback((next: PaginationRequestDto<CashierFilters>) => {
    setRequest((previous) => ({ ...previous, ...next, search: previous.search }));
  }, []);
  return { list, secondReceiver, filters, search, setSearch, submitSearch, onRequestChange };
}
