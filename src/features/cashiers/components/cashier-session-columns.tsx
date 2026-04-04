import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDateTime } from '@/lib/date';
import type { CashierSession } from '../types/cashier.types';

export function createCashierSessionColumns(
  onClose: (sessionId: string) => void,
): ColumnDef<CashierSession>[] {
  return [
    {
      accessorFn: (row) => row.cashierName ?? 'Unknown cashier',
      id: 'cashier',
      header: 'Cashier',
    },
    { accessorKey: 'status', header: 'Status' },
    {
      accessorFn: (row) => formatDateTime(row.scheduledStartTime),
      id: 'scheduledStartTimeLabel',
      header: 'Started',
    },
    {
      accessorFn: (row) => (row.actualEndTime ? formatDateTime(row.actualEndTime) : '-'),
      id: 'actualEndTimeLabel',
      header: 'Ended',
    },
    {
      accessorFn: (row) => (row.openingBalancePsw / 100).toFixed(2),
      id: 'openingBalance',
      header: 'Opening',
    },
    {
      accessorFn: (row) =>
        row.closingBalancePsw != null ? (row.closingBalancePsw / 100).toFixed(2) : '-',
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
      header: 'Action',
      enableSorting: false,
      size: 70,
      cell: ({ row }) =>
        row.original.status === 'ACTIVE' ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onClose(row.original.id)}>
                End session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null,
    },
  ];
}
