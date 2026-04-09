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
import { formatDateTime } from '@/lib/date';
import { PermissionKeys } from '@/shared/permissions/constants';
import { formatBaseQuantityWithBestUnits } from '@/shared/inventory/quantity-display';
import type { StockTransfer } from '../types/inventory-stock.types';
import { stockTransferStatusLabelByValue } from '../constants/stock-options';

export function createStockTransferColumns(
  productNameById?: ReadonlyMap<string, string>,
  locationNameById?: ReadonlyMap<string, string>,
  productConversionsById?: ReadonlyMap<string, { unitOfMeasure: number; factorToBase: string }[]>,
): ColumnDef<StockTransfer>[] {
  return [
    {
      accessorFn: (row) => productNameById?.get(row.productId) ?? 'Unknown product',
      id: 'productName',
      header: 'Product',
    },
    {
      accessorFn: (row) => locationNameById?.get(row.fromLocationId) ?? 'Unknown location',
      id: 'fromLocation',
      header: 'From',
    },
    {
      accessorFn: (row) => locationNameById?.get(row.toLocationId) ?? 'Unknown location',
      id: 'toLocation',
      header: 'To',
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }) =>
        formatBaseQuantityWithBestUnits(
          row.original.quantity,
          (productConversionsById?.get(row.original.productId) ?? []).map((conversion) => ({
            unitOfMeasure: conversion.unitOfMeasure,
            factorToBase: Number.parseInt(conversion.factorToBase, 10),
          })),
        ),
    },
    {
      accessorKey: 'fulfilledQuantity',
      header: 'Fulfilled',
      cell: ({ row }) =>
        formatBaseQuantityWithBestUnits(
          row.original.fulfilledQuantity,
          (productConversionsById?.get(row.original.productId) ?? []).map((conversion) => ({
            unitOfMeasure: conversion.unitOfMeasure,
            factorToBase: Number.parseInt(conversion.factorToBase, 10),
          })),
        ),
    },
    {
      accessorFn: (row) => {
        const requested = Number(row.quantity);
        const fulfilled = Number(row.fulfilledQuantity);
        return String(Math.max(0, requested - fulfilled));
      },
      id: 'remainingQuantity',
      header: 'Remaining',
      cell: ({ row }) =>
        formatBaseQuantityWithBestUnits(
          String(
            Math.max(0, Number(row.original.quantity) - Number(row.original.fulfilledQuantity)),
          ),
          (productConversionsById?.get(row.original.productId) ?? []).map((conversion) => ({
            unitOfMeasure: conversion.unitOfMeasure,
            factorToBase: Number.parseInt(conversion.factorToBase, 10),
          })),
        ),
    },
    {
      accessorFn: (row) => stockTransferStatusLabelByValue.get(row.status) ?? String(row.status),
      id: 'status',
      header: 'Status',
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (row.original.createdAt ? formatDateTime(row.original.createdAt) : '-'),
    },
    {
      id: 'actions',
      header: 'Action',
      size: 70,
      enableSorting: false,
      cell: ({ row }) => (
        <PermissionGuard permissionKey={PermissionKeys.CanUpdateStockTransfer}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/inventory/stock-transfers/receive/${row.original.id}`}>
                  Receive / Acknowledge
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/inventory/stock-transfers/edit/${row.original.id}`}>Edit</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PermissionGuard>
      ),
    },
  ];
}
