import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { Button } from '@/components/ui/button';
import { PermissionKeys } from '@/shared/permissions/constants';
import type { InventoryCategory } from '../types/inventory-category.types';

export function createInventoryCategoryColumns(): ColumnDef<InventoryCategory>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
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
        <PermissionGuard permissionKey={PermissionKeys.CanUpdateProductCategory}>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/inventory/categories/edit/${row.original.id}`}>Edit</Link>
          </Button>
        </PermissionGuard>
      ),
    },
  ];
}
