import { useCallback, useMemo, useState } from 'react';
import { DataTable } from '@/components/datatable';
import type { PaginationMeta } from '@/server/types/pagination.types';
import { useAuthStore } from '@/stores/auth-store';
import { useListBranchesQuery } from '../api/branches.api';
import { createBranchColumns } from './branch-columns';
import type { BranchListQuery } from '../types/branch.types';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function BranchesTable() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const serverFilters = useMemo(() => ({ companyId }), [companyId]);
  const [query, setQuery] = useState<BranchListQuery>({
    page: 1,
    pageSize: 20,
    filters: serverFilters,
  });
  const handleRequestChange = useCallback((request: BranchListQuery) => {
    setQuery(request);
  }, []);

  const { data, isLoading } = useListBranchesQuery(query, { skip: !companyId });
  const columns = useMemo(() => createBranchColumns(), []);

  return (
    <DataTable
      mode="server"
      data={data?.data ?? []}
      columns={columns}
      meta={data?.meta ?? EMPTY_META}
      loading={isLoading}
      serverFilters={serverFilters}
      onRequestChange={handleRequestChange}
      searchPlaceholder="Search branches..."
      enableVirtualization={false}
    />
  );
}
