import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { Button } from '@/components/ui/button';
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
      accessorFn: (row) => row.branch?.name ?? branchNameById?.get(row.branchId) ?? row.branchId,
      id: 'branchName',
      header: 'Branch',
      cell: ({ row }) =>
        row.original.branch?.name ??
        branchNameById?.get(row.original.branchId) ??
        row.original.branchId,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => row.original.description ?? '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 100,
      enableSorting: false,
      cell: ({ row }) => (
        <PermissionGuard permissionKey={PermissionKeys.CanUpdateInventoryLocation}>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/inventory/locations/edit/${row.original.id}`}>Edit</Link>
          </Button>
        </PermissionGuard>
      ),
    },
  ];
}
