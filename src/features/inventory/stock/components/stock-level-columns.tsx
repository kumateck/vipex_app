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
import { formatDateTime } from '@/lib/dates';
import { PermissionKeys } from '@/shared/permissions/constants';
import { formatBaseQuantityWithBestUnits } from '@/shared/inventory/quantity-display';
import type { StockLevel } from '../types/inventory-stock.types';

export function createStockLevelColumns(
  productNameById?: ReadonlyMap<string, string>,
  locationNameById?: ReadonlyMap<string, string>,
  productConversionsById?: ReadonlyMap<string, { unitOfMeasure: number; factorToBase: string }[]>,
): ColumnDef<StockLevel>[] {
  return [
    {
      accessorFn: (row) => productNameById?.get(row.productId) ?? row.productName ?? row.productId,
      id: 'productName',
      header: 'Product',
    },
    {
      accessorFn: (row) =>
        locationNameById?.get(row.locationId) ?? row.locationName ?? row.locationId,
      id: 'locationName',
      header: 'Location',
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }) =>
        formatBaseQuantityWithBestUnits(
          row.original.quantity ?? '0',
          (productConversionsById?.get(row.original.productId) ?? []).map((conversion) => ({
            unitOfMeasure: conversion.unitOfMeasure,
            factorToBase: Number.parseInt(conversion.factorToBase, 10),
          })),
        ),
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated',
      cell: ({ row }) => (row.original.updatedAt ? formatDateTime(row.original.updatedAt) : '-'),
    },
    {
      id: 'actions',
      header: 'Action',
      size: 70,
      enableSorting: false,
      cell: ({ row }) => (
        <PermissionGuard permissionKey={PermissionKeys.CanGetStockLevel}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  to={`/inventory/stock-levels/${row.original.productId}/${row.original.locationId}`}
                >
                  View
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PermissionGuard>
      ),
    },
  ];
}
