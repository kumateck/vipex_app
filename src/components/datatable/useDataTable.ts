import * as React from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnFiltersState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  useReactTable,
} from '@tanstack/react-table';
import type { PaginationRequestDto, SortField } from '@/server/types/pagination.types';
import type { DataTableProps, DataTableStateHandlers } from './types';

const SERVER_SEARCH_DEBOUNCE_MS = 3000;

function toSortFields(sorting: SortingState): SortField[] {
  return sorting.map((s) => ({ field: s.id, direction: s.desc ? 'desc' : 'asc' }));
}

type UseDataTableReturn<TData, TFilters> = {
  table: ReturnType<typeof useReactTable<TData>>;
  state: DataTableStateHandlers;
  serverRequest?: PaginationRequestDto<TFilters>;
};

function isSameRequest<TFilters>(
  prev: PaginationRequestDto<TFilters> | null,
  next: PaginationRequestDto<TFilters>,
) {
  if (!prev) return false;

  return (
    prev.page === next.page &&
    prev.pageSize === next.pageSize &&
    prev.search === next.search &&
    prev.dateFrom === next.dateFrom &&
    prev.dateTo === next.dateTo &&
    JSON.stringify(prev.sort ?? []) === JSON.stringify(next.sort ?? []) &&
    JSON.stringify(prev.filters ?? {}) === JSON.stringify(next.filters ?? {})
  );
}

export function useDataTable<TData, TValue, TFilters = Record<string, unknown>>(
  props: DataTableProps<TData, TValue, TFilters>,
): UseDataTableReturn<TData, TFilters> {
  const serverProps = props.mode === 'server' ? props : null;
  const serverPage = serverProps?.meta.page;
  const serverPageSize = serverProps?.meta.pageSize;
  const serverTotalPages = serverProps?.meta.totalPages;
  const serverFilters = serverProps?.serverFilters;
  const onServerRequestChange = serverProps?.onRequestChange;
  const isServer = props.mode === 'server';
  const isGrid = props.mode === 'grid';

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>(
    props.mode === 'server' && props.defaultSort
      ? props.defaultSort.map((s) => ({ id: s.field, desc: s.direction === 'desc' }))
      : [],
  );
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = React.useState('');
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: serverProps ? Math.max((serverPage ?? 1) - 1, 0) : 0,
    pageSize: serverProps
      ? (serverPageSize ?? 10)
      : props.mode === 'client'
        ? (props.initialPageSize ?? 10)
        : 10,
  });

  React.useEffect(() => {
    if (!isServer) return;
    setPagination((prev) => {
      const nextPageIndex = Math.max((serverPage ?? 1) - 1, 0);
      if (prev.pageIndex === nextPageIndex && prev.pageSize === (serverPageSize ?? prev.pageSize))
        return prev;
      return { pageIndex: nextPageIndex, pageSize: serverPageSize ?? prev.pageSize };
    });
  }, [isServer, serverPage, serverPageSize]);

  React.useEffect(() => {
    if (!isServer) {
      setDebouncedGlobalFilter(globalFilter);
      return;
    }
    const timeout = window.setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
    }, SERVER_SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [globalFilter, isServer]);

  const serverRequest = React.useMemo(() => {
    if (!isServer) return undefined;
    return {
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      search: debouncedGlobalFilter || undefined,
      sort: toSortFields(sorting),
      filters: serverFilters,
    } satisfies PaginationRequestDto<TFilters>;
  }, [
    debouncedGlobalFilter,
    isServer,
    pagination.pageIndex,
    pagination.pageSize,
    serverFilters,
    sorting,
  ]);

  const lastRequestRef = React.useRef<PaginationRequestDto<TFilters> | null>(null);

  React.useEffect(() => {
    if (!isServer) return;
    if (globalFilter !== debouncedGlobalFilter) return;
    const nextRequest: PaginationRequestDto<TFilters> = {
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      search: debouncedGlobalFilter || undefined,
      sort: toSortFields(sorting),
      filters: serverFilters,
    };

    if (isSameRequest(lastRequestRef.current, nextRequest)) return;
    lastRequestRef.current = nextRequest;
    onServerRequestChange?.(nextRequest);
  }, [
    debouncedGlobalFilter,
    globalFilter,
    isServer,
    onServerRequestChange,
    pagination.pageIndex,
    pagination.pageSize,
    serverFilters,
    sorting,
  ]);

  const table = useReactTable({
    data: props.data,
    columns: props.columns,
    pageCount: serverTotalPages,
    state: {
      pagination: isGrid ? undefined : pagination,
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
    },
    enableRowSelection: props.enableRowSelection ?? true,
    enableFilters: props.enableFiltering ?? true,
    enableSorting: props.enableSorting ?? true,
    enableHiding: props.enableColumnVisibility ?? true,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: !isServer ? getFilteredRowModel() : undefined,
    getPaginationRowModel: !isServer && !isGrid ? getPaginationRowModel() : undefined,
    getSortedRowModel: !isServer ? getSortedRowModel() : undefined,
    manualPagination: isServer || isGrid,
    manualSorting: isServer,
    manualFiltering: isServer,
  });

  return {
    table,
    state: {
      pagination,
      sorting,
      columnFilters,
      rowSelection,
      columnVisibility,
      globalFilter,
      onPaginationChange: setPagination,
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      onRowSelectionChange: setRowSelection,
      onColumnVisibilityChange: setColumnVisibility,
      onGlobalFilterChange: setGlobalFilter,
    },
    serverRequest,
  };
}
