import type { ColumnDef } from '@tanstack/react-table';
import { formatDateTime } from '@/lib/date';
import type { StockAdjustment } from '../types/inventory-stock.types';
import { stockAdjustmentReasonLabelByValue } from '../constants/stock-options';

export function createStockAdjustmentColumns(
  productNameById?: ReadonlyMap<string, string>,
  locationNameById?: ReadonlyMap<string, string>,
): ColumnDef<StockAdjustment>[] {
  return [
    {
      accessorFn: (row) => productNameById?.get(row.productId) ?? 'Unknown product',
      id: 'productName',
      header: 'Product',
    },
    {
      accessorFn: (row) => locationNameById?.get(row.locationId) ?? 'Unknown location',
      id: 'locationName',
      header: 'Location',
    },
    {
      accessorFn: (row) => stockAdjustmentReasonLabelByValue.get(row.reason) ?? String(row.reason),
      id: 'reason',
      header: 'Reason',
    },
    {
      accessorKey: 'quantityChange',
      header: 'Qty change',
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (row.original.createdAt ? formatDateTime(row.original.createdAt) : '-'),
    },
  ];
}
