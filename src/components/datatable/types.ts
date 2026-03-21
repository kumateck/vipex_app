import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
  SortingState,
  Table,
  VisibilityState,
} from '@tanstack/react-table';
import type {
  PaginatedResponseDto,
  PaginationMeta,
  PaginationRequestDto,
  SortField,
} from '@/server/types/pagination.types';

export type DataTableMode = 'server' | 'client' | 'grid';
export type TableSize = 'small' | 'medium' | 'large';

export interface DataTableCommonProps<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  className?: string;
  tableSize?: TableSize;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  stickyHeader?: boolean;
  enableVirtualization?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  pageSizeOptions?: number[];
  searchPlaceholder?: string;
  searchColumn?: string;
  showSearch?: boolean;
}

export interface DataTableServerProps<TData, TValue, TFilters = Record<string, unknown>>
  extends DataTableCommonProps<TData, TValue> {
  mode: 'server';
  meta: PaginationMeta;
  serverFilters?: TFilters;
  defaultSort?: SortField[];
  onRequestChange?: (request: PaginationRequestDto<TFilters>) => void;
}

export interface DataTableClientProps<TData, TValue>
  extends DataTableCommonProps<TData, TValue> {
  mode: 'client';
  initialPageSize?: number;
}

export interface DataTableGridProps<TData, TValue> extends DataTableCommonProps<TData, TValue> {
  mode: 'grid';
}

export type DataTableProps<TData, TValue, TFilters = Record<string, unknown>> =
  | DataTableServerProps<TData, TValue, TFilters>
  | DataTableClientProps<TData, TValue>
  | DataTableGridProps<TData, TValue>;

export interface DataTableContextProps<TData> {
  table: Table<TData>;
  tableSize: TableSize;
  enableVirtualization: boolean;
  loading: boolean;
}

export interface DataTableStateHandlers {
  pagination: PaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  rowSelection: RowSelectionState;
  columnVisibility: VisibilityState;
  globalFilter: string;
  onPaginationChange: OnChangeFn<PaginationState>;
  onSortingChange: OnChangeFn<SortingState>;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  onRowSelectionChange: OnChangeFn<RowSelectionState>;
  onColumnVisibilityChange: OnChangeFn<VisibilityState>;
  onGlobalFilterChange: (value: string) => void;
}

export type ServerPaginatedData<T> = PaginatedResponseDto<T>;
