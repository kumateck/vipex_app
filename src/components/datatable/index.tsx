import * as React from 'react';
import type { DataTableProps, TableSize } from './types';
import { useDataTable } from './useDataTable';
import {
  DataTableBody,
  DataTableHeader,
  DataTablePagination,
  DataTableSkeleton,
  DataTableToolbar,
  DataTableVirtualBody,
} from './components';

import { Table as UiTable } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export function DataTable<TData, TValue, TFilters = Record<string, unknown>>(
  props: DataTableProps<TData, TValue, TFilters>,
) {
  const {
    tableSize: initialTableSize = 'medium',
    enableVirtualization = false,
    stickyHeader = false,
    loading = false,
    className,
    emptyMessage = 'No results.',
    searchColumn,
    searchPlaceholder,
    pageSizeOptions,
  } = props;

  const [tableSize, setTableSize] = React.useState<TableSize>(initialTableSize);
  const { table, state } = useDataTable(props);
  const parentRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <div className={cn('w-full space-y-4', className)}>
      <DataTableToolbar
        table={table}
        tableSize={tableSize}
        setTableSize={setTableSize}
        globalFilter={state.globalFilter}
        setGlobalFilter={state.onGlobalFilterChange}
        searchColumn={searchColumn}
        searchPlaceholder={searchPlaceholder}
      />

      <div
        ref={parentRef}
        className={cn(
          'relative rounded-md border',
          enableVirtualization ? 'h-[600px] overflow-auto' : 'overflow-hidden',
        )}
      >
        <UiTable
          className={cn(
            tableSize === 'small' ? 'text-sm' : tableSize === 'large' ? 'text-lg' : '',
            stickyHeader && 'relative',
          )}
        >
          <DataTableHeader table={table} sticky={stickyHeader} />

          {loading ? (
            <DataTableSkeleton columnCount={props.columns.length} rowCount={10} />
          ) : enableVirtualization ? (
            <DataTableVirtualBody table={table} parentRef={parentRef} tableSize={tableSize} />
          ) : (
            <DataTableBody
              table={table}
              isLoading={loading}
              columns={props.columns}
              emptyMessage={emptyMessage}
            />
          )}
        </UiTable>
      </div>

      <DataTablePagination
        table={table}
        mode={props.mode}
        meta={props.mode === 'server' ? props.meta : undefined}
        pageSizeOptions={pageSizeOptions}
      />
    </div>
  );
}

export * from './types';
export * from './useDataTable';
export * from './server';
