import { useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { type ParcelSearchRow, useSearchParcelsQuery } from '../../api/parcel.api';
import { ParcelSuperSearchDetailsDialog } from './parcel-super-search-details-dialog';
import { ParcelSuperSearchTable } from './parcel-super-search-table';
import type { ParcelSuperSearchQuery } from './types';

export function ParcelSuperSearchPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;

  const [searchInput, setSearchInput] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [query, setQuery] = useState<ParcelSuperSearchQuery>({
    page: 1,
    pageSize: 20,
    filters: { companyId, includeDeleted: true },
  });
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);

  const shouldSearch = submittedSearch.trim().length > 0;

  const { data, isLoading } = useSearchParcelsQuery(
    {
      ...query,
      search: shouldSearch ? submittedSearch.trim() : undefined,
      filters: { companyId, includeDeleted: true },
    },
    {
      skip: !companyId || !shouldSearch,
    },
  );

  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const branchNameById = useMemo(
    () => new Map(branchOptions.map((branch) => [branch.id, branch.name])),
    [branchOptions],
  );

  const rows = data?.data ?? [];
  const rowById = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);
  const selectedParcelRow: ParcelSearchRow | undefined = selectedParcelId
    ? rowById.get(selectedParcelId)
    : undefined;

  const submitSearch = () => {
    setSubmittedSearch(searchInput.trim());
    setQuery((prev) => ({ ...prev, page: 1, filters: { companyId, includeDeleted: true } }));
  };

  return (
    <div className="w-full space-y-4 p-4">
      <ParcelSuperSearchTable
        companyId={companyId}
        shouldSearch={shouldSearch}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearchSubmit={submitSearch}
        rows={rows}
        meta={data?.meta}
        loading={isLoading}
        branchNameById={branchNameById}
        onRequestChange={setQuery}
        onViewDetails={setSelectedParcelId}
      />

      <ParcelSuperSearchDetailsDialog
        parcelId={selectedParcelId}
        companyId={companyId}
        branchNameById={branchNameById}
        selectedParcelRow={selectedParcelRow}
        onClose={() => setSelectedParcelId(null)}
      />
    </div>
  );
}
