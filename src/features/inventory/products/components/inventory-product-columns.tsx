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
import type { InventoryProduct } from '../types/inventory-product.types';

export const UNIT_OF_MEASURE_OPTIONS = [
  { value: 0, label: 'Piece' },
  { value: 1, label: 'Box' },
  { value: 2, label: 'Carton' },
  { value: 3, label: 'Kg' },
  { value: 4, label: 'Liter' },
  { value: 5, label: 'Meter' },
  { value: 6, label: 'Pack' },
  { value: 7, label: 'Dozen' },
] as const;

export function createInventoryProductColumns(
  categoryNameById?: ReadonlyMap<string, string>,
): ColumnDef<InventoryProduct>[] {
  const uomNameByValue = new Map<number, string>(
    UNIT_OF_MEASURE_OPTIONS.map((item) => [item.value, item.label] as const),
  );

  return [
    {
      accessorKey: 'sku',
      header: 'SKU',
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorFn: (row) =>
        row.categoryId ? (categoryNameById?.get(row.categoryId) ?? 'Unknown category') : '-',
      id: 'categoryName',
      header: 'Category',
    },
    {
      accessorFn: (row) => uomNameByValue.get(row.unitOfMeasure) ?? String(row.unitOfMeasure),
      id: 'unitOfMeasure',
      header: 'Unit',
    },
    {
      accessorKey: 'minStockLevel',
      header: 'Min Stock',
      cell: ({ row }) => row.original.minStockLevel || '0',
    },
    {
      id: 'actions',
      header: 'Action',
      size: 70,
      enableSorting: false,
      cell: ({ row }) => (
        <PermissionGuard permissionKey={PermissionKeys.CanUpdateProduct}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/inventory/products/edit/${row.original.id}`}>Edit</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PermissionGuard>
      ),
    },
  ];
}
