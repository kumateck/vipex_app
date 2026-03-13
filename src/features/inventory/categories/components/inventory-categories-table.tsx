import { useCallback, useMemo, useState } from 'react';
import { DataTable } from '@/components/datatable';
import type { PaginationMeta } from '@/server/types/pagination.types';
import { useAuthStore } from '@/stores/auth-store';
import { useListInventoryCategoriesQuery } from '../api/inventory-categories.api';
import { createInventoryCategoryColumns } from './inventory-category-columns';
import type { InventoryCategoryListQuery } from '../types/inventory-category.types';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function InventoryCategoriesTable() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const serverFilters = useMemo(() => ({ companyId }), [companyId]);
  const [query, setQuery] = useState<InventoryCategoryListQuery>({
    page: 1,
    pageSize: 20,
    filters: serverFilters,
  });

  const { data, isLoading } = useListInventoryCategoriesQuery(query, {
    skip: !companyId,
  });

  const columns = useMemo(() => createInventoryCategoryColumns(), []);

  const handleRequestChange = useCallback((request: InventoryCategoryListQuery) => {
    setQuery(request);
  }, []);

  return (
    <DataTable
      mode="server"
      data={data?.data ?? []}
      columns={columns}
      meta={data?.meta ?? EMPTY_META}
      loading={isLoading}
      serverFilters={serverFilters}
      onRequestChange={handleRequestChange}
      searchPlaceholder="Search categories..."
      enableVirtualization={false}
    />
  );
}
