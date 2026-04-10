import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDateTime } from '@/lib/date';
import { PermissionKeys } from '@/shared/permissions/constants';
import type { StockRequest } from '../types/inventory-stock.types';
import { stockRequestStatusLabelByValue } from '../constants/stock-options';

export function createStockRequestColumns(
  locationNameById?: ReadonlyMap<string, string>,
): ColumnDef<StockRequest>[] {
  return [
    {
      accessorFn: (row) =>
        locationNameById?.get(row.requesterLocationId) ?? row.requesterLocationId,
      id: 'requesterLocation',
      header: 'Requester Location',
    },
    {
      accessorFn: (row) =>
        row.requestedToLocationId
          ? (locationNameById?.get(row.requestedToLocationId) ?? row.requestedToLocationId)
          : '-',
      id: 'requestedToLocation',
      header: 'Requested To',
    },
    {
      accessorFn: (row) => stockRequestStatusLabelByValue.get(row.status) ?? String(row.status),
      id: 'status',
      header: 'Status',
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (row.original.createdAt ? formatDateTime(row.original.createdAt) : '-'),
    },
    {
      id: 'actions',
      header: 'Action',
      size: 70,
      enableSorting: false,
      cell: ({ row }) => (
        <PermissionGuard permissionKey={PermissionKeys.CanGetStockRequest}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/inventory/stock-requests/view/${row.original.id}`}>View</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PermissionGuard>
      ),
    },
  ];
}
