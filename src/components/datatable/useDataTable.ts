import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
} from '@tanstack/react-table';
import type { DataTableProps } from './types';

export function useDataTable<TData, TValue>({
  data,
  columns,
  paginationMode,
  pageCount,
  onPaginationChange,
  onSortingChange,
  onFilterChange,
  onRowSelectionChange,
  enableSorting = true,
  enableFiltering = true,
  enableRowSelection = true,
  enableColumnVisibility = true,
}: DataTableProps<TData, TValue>) {
  // Internal state for client-mode or uncontrolled server-mode fallback
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const isServer = paginationMode === 'server';
  const isNone = paginationMode === 'none';

  const table = useReactTable({
    data,
    columns,
    pageCount: isServer ? pageCount : undefined,
    state: {
      pagination: isNone ? undefined : pagination,
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection,
    enableFilters: enableFiltering,
    enableSorting: enableSorting,
    enableHiding: enableColumnVisibility,

    // Handlers
    onPaginationChange: (updater) => {
      if (onPaginationChange) onPaginationChange(updater);
      setPagination(updater);
    },
    onSortingChange: (updater) => {
      if (onSortingChange) onSortingChange(updater);
      setSorting(updater);
    },
    onColumnFiltersChange: (updater) => {
      if (onFilterChange) onFilterChange(updater);
      setColumnFilters(updater);
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      if (onRowSelectionChange) onRowSelectionChange(updater);
      setRowSelection(updater);
    },

    // Models
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: !isServer ? getFilteredRowModel() : undefined,
    getPaginationRowModel: !isServer && !isNone ? getPaginationRowModel() : undefined,
    getSortedRowModel: !isServer ? getSortedRowModel() : undefined,

    // Manual flags for server-side control
    manualPagination: isServer || isNone,
    manualSorting: isServer,
    manualFiltering: isServer,
  });

  return table;
}
