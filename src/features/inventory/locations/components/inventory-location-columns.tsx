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
import { PermissionKeys } from '@/shared/permissions/constants';
import type { InventoryLocation } from '../types/inventory-location.types';

export function createInventoryLocationColumns(
  branchNameById?: ReadonlyMap<string, string>,
): ColumnDef<InventoryLocation>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorFn: (row) =>
        row.branch?.name ?? branchNameById?.get(row.branchId) ?? 'Unknown branch',
      id: 'branchName',
      header: 'Branch',
      cell: ({ row }) =>
        row.original.branch?.name ?? branchNameById?.get(row.original.branchId) ?? 'Unknown branch',
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => row.original.description ?? '-',
    },
    {
      id: 'actions',
      header: 'Action',
      size: 70,
      enableSorting: false,
      cell: ({ row }) => (
        <PermissionGuard permissionKey={PermissionKeys.CanUpdateInventoryLocation}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/inventory/locations/edit/${row.original.id}`}>Edit</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PermissionGuard>
      ),
    },
  ];
}
