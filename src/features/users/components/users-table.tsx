import { useCallback, useMemo, useState } from 'react';
import { DataTable } from '@/components/datatable';
import type { PaginationMeta } from '@/server/types/pagination.types';
import { useAuthStore } from '@/stores/auth-store';
import { useListUsersQuery } from '../api/users.api';
import { createUserColumns } from './user-columns';
import type { UserListQuery } from '../types/user.types';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function UsersTable() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const serverFilters = useMemo(() => ({ companyId }), [companyId]);
  const [query, setQuery] = useState<UserListQuery>({
    page: 1,
    pageSize: 20,
    filters: serverFilters,
  });
  const handleRequestChange = useCallback((request: UserListQuery) => {
    setQuery(request);
  }, []);

  const { data, isLoading } = useListUsersQuery(query, { skip: !companyId });
  const columns = useMemo(() => createUserColumns(), []);

  return (
    <DataTable
      mode="server"
      data={data?.data ?? []}
      columns={columns}
      meta={data?.meta ?? EMPTY_META}
      loading={isLoading}
      serverFilters={serverFilters}
      onRequestChange={handleRequestChange}
      searchPlaceholder="Search users..."
      enableVirtualization={false}
    />
  );
}
