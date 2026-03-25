import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { StockLevel } from '../types/inventory-stock.types';

export function createStockLevelColumns(
  productNameById?: ReadonlyMap<string, string>,
  locationNameById?: ReadonlyMap<string, string>,
): ColumnDef<StockLevel>[] {
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
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }) => row.original.quantity ?? '0',
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated',
      cell: ({ row }) => row.original.updatedAt ?? '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 100,
      enableSorting: false,
      cell: ({ row }) => (
        <Button variant="outline" size="sm" asChild>
          <Link to={`/inventory/stock-levels/${row.original.productId}/${row.original.locationId}`}>View</Link>
        </Button>
      ),
    },
  ];
}
