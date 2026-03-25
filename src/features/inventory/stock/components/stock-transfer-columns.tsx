import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { StockTransfer } from '../types/inventory-stock.types';
import { stockTransferStatusLabelByValue } from '../constants/stock-options';

export function createStockTransferColumns(
  productNameById?: ReadonlyMap<string, string>,
  locationNameById?: ReadonlyMap<string, string>,
): ColumnDef<StockTransfer>[] {
  return [
    {
      accessorFn: (row) => productNameById?.get(row.productId) ?? row.productId,
      id: 'productName',
      header: 'Product',
    },
    {
      accessorFn: (row) => locationNameById?.get(row.fromLocationId) ?? row.fromLocationId,
      id: 'fromLocation',
      header: 'From',
    },
    {
      accessorFn: (row) => locationNameById?.get(row.toLocationId) ?? row.toLocationId,
      id: 'toLocation',
      header: 'To',
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
    },
    {
      accessorFn: (row) => stockTransferStatusLabelByValue.get(row.status) ?? String(row.status),
      id: 'status',
      header: 'Status',
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => row.original.createdAt ?? '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 100,
      enableSorting: false,
      cell: ({ row }) => (
        <Button variant="outline" size="sm" asChild>
          <Link to={`/inventory/stock-transfers/edit/${row.original.id}`}>Edit</Link>
        </Button>
      ),
    },
  ];
}
