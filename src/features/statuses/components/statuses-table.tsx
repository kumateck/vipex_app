import { useCallback, useMemo, useState } from 'react';
import { DataTable } from '@/components/datatable';
import type { PaginationMeta } from '@/server/types/pagination.types';
import { useAuthStore } from '@/stores/auth-store';
import { useListStatusesQuery } from '../api/statuses.api';
import { createStatusColumns } from './status-columns';
import type { StatusListQuery } from '../types/status.types';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function StatusesTable() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const serverFilters = useMemo(() => ({ companyId }), [companyId]);
  const [query, setQuery] = useState<StatusListQuery>({
    page: 1,
    pageSize: 20,
    filters: serverFilters,
  });
  const handleRequestChange = useCallback((request: StatusListQuery) => {
    setQuery(request);
  }, []);

  const { data, isLoading } = useListStatusesQuery(query, { skip: !companyId });
  const columns = useMemo(() => createStatusColumns(), []);

  return (
    <DataTable
      mode="server"
      data={data?.data ?? []}
      columns={columns}
      meta={data?.meta ?? EMPTY_META}
      loading={isLoading}
      serverFilters={serverFilters}
      onRequestChange={handleRequestChange}
      searchPlaceholder="Search statuses..."
      enableVirtualization={false}
    />
  );
}
