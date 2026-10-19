import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useListShelfPickupReassignmentsQuery } from '../services';
import type { ShelfPickupParcel } from '../types';

export function useShelfPickupReassignment() {
  const user = useAuthStore((state) => state.user);
  const [params] = useSearchParams();
  const initialSearch = params.get('search') ?? '';
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ShelfPickupParcel | null>(null);
  const scope = {
    companyId: user?.company?.id ?? '',
    branchId: user?.branch?.id ?? '',
    locationId: user?.location?.id ?? user?.locationId ?? null,
    userId: user?.id ?? '',
  };
  const result = useListShelfPickupReassignmentsQuery(
    { ...scope, page, pageSize: 20, search },
    {
      skip: !scope.companyId || !scope.branchId || !scope.userId,
    },
  );
  const submitSearch = () => {
    const next = searchInput.trim();
    if (next === search && page === 1) void result.refetch();
    else {
      setSearch(next);
      setPage(1);
    }
    setSelected(null);
  };
  const close = useCallback(() => setSelected(null), []);
  return {
    scope,
    searchInput,
    setSearchInput,
    submitSearch,
    page,
    setPage,
    selected,
    setSelected,
    close,
    result,
  };
}
