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
import { InventoryLocationType } from '@/db/schemas/enums';
import type { InventoryLocation } from '../types/inventory-location.types';

const locationTypeLabelByValue = new Map<number, string>([
  [InventoryLocationType.MAIN_STORE, 'Main Store'],
  [InventoryLocationType.BRANCH_STORE, 'Branch Store'],
  [InventoryLocationType.CONSUMPTION_LOCATION, 'Consumption Location'],
]);

export function createInventoryLocationColumns(
  branchNameById?: ReadonlyMap<string, string>,
  parentLocationNameById?: ReadonlyMap<string, string>,
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
      accessorFn: (row) =>
        locationTypeLabelByValue.get(row.locationType) ?? String(row.locationType),
      id: 'locationType',
      header: 'Type',
      cell: ({ row }) =>
        locationTypeLabelByValue.get(row.original.locationType) ??
        String(row.original.locationType),
    },
    {
      accessorFn: (row) =>
        row.parentLocationId
          ? (parentLocationNameById?.get(row.parentLocationId) ?? row.parentLocationId)
          : '-',
      id: 'parentLocationName',
      header: 'Parent',
      cell: ({ row }) =>
        row.original.parentLocationId
          ? (parentLocationNameById?.get(row.original.parentLocationId) ??
            row.original.parentLocationId)
          : '-',
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
