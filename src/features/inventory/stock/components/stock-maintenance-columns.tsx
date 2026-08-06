import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { formatDateTime } from '@/lib/dates';
import type { StockMaintenanceRecord } from '../types/inventory-stock.types';
import {
  stockMaintenanceIssueTypeLabelByValue,
  stockMaintenanceStatusLabelByValue,
} from '../constants/stock-options';

export function createStockMaintenanceColumns(
  productNameById?: ReadonlyMap<string, string>,
  locationNameById?: ReadonlyMap<string, string>,
): ColumnDef<StockMaintenanceRecord>[] {
  return [
    {
      accessorFn: (row) => productNameById?.get(row.productId) ?? row.productId,
      id: 'product',
      header: 'Product',
    },
    {
      accessorFn: (row) => locationNameById?.get(row.locationId) ?? row.locationId,
      id: 'location',
      header: 'Location',
    },
    {
      accessorFn: (row) =>
        stockMaintenanceIssueTypeLabelByValue.get(row.issueType) ?? String(row.issueType),
      id: 'issueType',
      header: 'Issue',
    },
    {
      accessorFn: (row) => stockMaintenanceStatusLabelByValue.get(row.status) ?? String(row.status),
      id: 'status',
      header: 'Status',
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (row.original.createdAt ? formatDateTime(row.original.createdAt) : '-'),
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => (
        <Link to={`/inventory/stock-maintenance/view/${row.original.id}`}>View</Link>
      ),
    },
  ];
}
