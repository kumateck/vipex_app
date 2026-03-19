import type { ColumnDef } from '@tanstack/react-table';
import type { StockMovement } from '../types/inventory-stock.types';
import { stockMovementTypeLabelByValue } from '../constants/stock-options';

export function createStockMovementColumns(
  productNameById?: ReadonlyMap<string, string>,
  locationNameById?: ReadonlyMap<string, string>,
): ColumnDef<StockMovement>[] {
  return [
    {
      accessorFn: (row) => productNameById?.get(row.productId) ?? row.productId,
      id: 'productName',
      header: 'Product',
    },
    {
      accessorFn: (row) => locationNameById?.get(row.locationId) ?? row.locationId,
      id: 'locationName',
      header: 'Location',
    },
    {
      accessorFn: (row) => stockMovementTypeLabelByValue.get(row.movementType) ?? String(row.movementType),
      id: 'movementType',
      header: 'Type',
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => row.original.createdAt ?? '-',
    },
  ];
}
