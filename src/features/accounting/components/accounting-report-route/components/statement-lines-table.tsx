import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/datatable';
import { formatMoney } from '../../accounting-shared';

type StatementLine = {
  accountCode: string;
  accountName: string;
  amountPsw: number;
};

export function StatementLinesTable({ rows }: { rows: StatementLine[] }) {
  const columns = useMemo<ColumnDef<StatementLine>[]>(
    () => [
      { accessorKey: 'accountCode', header: 'Code' },
      { accessorKey: 'accountName', header: 'Account' },
      {
        id: 'amount',
        header: 'Amount',
        accessorFn: (row) => formatMoney(row.amountPsw),
      },
    ],
    [],
  );

  return (
    <DataTable
      mode="client"
      data={rows}
      columns={columns}
      showSearch
      searchPlaceholder="Search report lines"
      pageSizeOptions={[10, 20, 50]}
    />
  );
}
