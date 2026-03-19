import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
        row.categoryId ? categoryNameById?.get(row.categoryId) ?? row.categoryId : '-',
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
      header: 'Actions',
      size: 100,
      enableSorting: false,
      cell: ({ row }) => (
        <Button variant="outline" size="sm" asChild>
          <Link to={`/inventory/products/edit/${row.original.id}`}>Edit</Link>
        </Button>
      ),
    },
  ];
}
