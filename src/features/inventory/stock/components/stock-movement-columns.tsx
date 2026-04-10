import type { ColumnDef } from '@tanstack/react-table';
import { formatDateTime } from '@/lib/date';
import { formatBaseQuantityWithBestUnits } from '@/shared/inventory/quantity-display';
import type { StockMovement } from '../types/inventory-stock.types';
import { stockMovementTypeLabelByValue } from '../constants/stock-options';

export function createStockMovementColumns(
  productNameById?: ReadonlyMap<string, string>,
  locationNameById?: ReadonlyMap<string, string>,
  productConversionsById?: ReadonlyMap<string, { unitOfMeasure: number; factorToBase: string }[]>,
): ColumnDef<StockMovement>[] {
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
      accessorFn: (row) =>
        stockMovementTypeLabelByValue.get(row.movementType) ?? String(row.movementType),
      id: 'movementType',
      header: 'Type',
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
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (row.original.createdAt ? formatDateTime(row.original.createdAt) : '-'),
    },
  ];
}
