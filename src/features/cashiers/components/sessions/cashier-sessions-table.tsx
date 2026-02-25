import { useMemo } from 'react';
import { DataTable } from '@/components/datatable';
import type { PaginationMeta } from '@/server/types/pagination.types';
import { createCashierSessionColumns } from '../cashier-session-columns';
import type { CashierSession, CashierSessionListQuery } from '../../types/cashier.types';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

interface CashierSessionsTableProps {
  data: CashierSession[];
  meta?: PaginationMeta;
  loading: boolean;
  branchId: string | null;
  onRequestChange: (request: CashierSessionListQuery) => void;
  onCloseSession: (sessionId: string) => void;
}

export function CashierSessionsTable({
  data,
  meta,
  loading,
  branchId,
  onRequestChange,
  onCloseSession,
}: CashierSessionsTableProps) {
  const columns = useMemo(() => createCashierSessionColumns(onCloseSession), [onCloseSession]);

  return (
    <DataTable
      mode="server"
      data={data}
      columns={columns}
      meta={meta ?? EMPTY_META}
      loading={loading}
      serverFilters={{ branchId }}
      onRequestChange={onRequestChange}
      searchPlaceholder="Search sessions..."
      enableVirtualization={false}
    />
  );
}
