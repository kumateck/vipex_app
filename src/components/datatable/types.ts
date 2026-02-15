import type {
  ColumnDef,
  OnChangeFn,
  PaginationState,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
  Table,
} from '@tanstack/react-table';

export type PaginationMode = 'client' | 'server' | 'none';
export type TableSize = 'small' | 'medium' | 'large';

export interface DataTableProps<TData, TValue> {
  // Required Props
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  paginationMode: PaginationMode;

  // Appearance
  tableSize?: TableSize;
  className?: string;

  // Data State (Server-side mainly)
  pageCount?: number;
  totalRows?: number;
  loading?: boolean;
  error?: string | null;

  // Features Configuration
  enableVirtualization?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  stickyHeader?: boolean;

  // Callbacks
  onPaginationChange?: OnChangeFn<PaginationState>;
  onSortingChange?: OnChangeFn<SortingState>;
  onFilterChange?: OnChangeFn<ColumnFiltersState>;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
}

export interface DataTableContextProps<TData> {
  table: Table<TData>;
  tableSize: TableSize;
  enableVirtualization: boolean;
  loading: boolean;
  totalRows?: number;
}
