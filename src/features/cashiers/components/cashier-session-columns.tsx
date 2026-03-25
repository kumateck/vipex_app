import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import type { CashierSession } from '../types/cashier.types';

export function createCashierSessionColumns(onClose: (sessionId: string) => void): ColumnDef<CashierSession>[] {
  return [
    {
      accessorFn: (row) => row.cashierName ?? row.cashierId,
      id: 'cashier',
      header: 'Cashier',
    },
    { accessorKey: 'status', header: 'Status' },
    {
      accessorFn: (row) => new Date(row.scheduledStartTime).toLocaleString(),
      id: 'scheduledStartTimeLabel',
      header: 'Started',
    },
    {
      accessorFn: (row) => (row.actualEndTime ? new Date(row.actualEndTime).toLocaleString() : '-'),
      id: 'actualEndTimeLabel',
      header: 'Ended',
    },
    {
      accessorFn: (row) => (row.openingBalancePsw / 100).toFixed(2),
      id: 'openingBalance',
      header: 'Opening',
    },
    {
      accessorFn: (row) => (row.closingBalancePsw != null ? (row.closingBalancePsw / 100).toFixed(2) : '-'),
      id: 'closingBalance',
      header: 'Closing',
    },
    {
      accessorFn: (row) => (row.currentBalancePsw / 100).toFixed(2),
      id: 'currentBalance',
      header: 'Current Balance',
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      size: 120,
      cell: ({ row }) =>
        row.original.status === 'ACTIVE' ? (
          <Button size="sm" variant="outline" onClick={() => onClose(row.original.id)}>
            End session
          </Button>
        ) : null,
    },
  ];
}
