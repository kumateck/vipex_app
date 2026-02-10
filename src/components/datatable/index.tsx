import * as React from 'react';
import { type DataTableProps, type TableSize } from './types';
import { useDataTable } from './useDataTable';
import {
  DataTableHeader,
  DataTableBody,
  DataTableVirtualBody,
  DataTablePagination,
  DataTableToolbar,
  DataTableSkeleton,
} from './components';

import { Table as UiTable } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export function DataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
  const {
    tableSize: initialTableSize = 'medium',
    enableVirtualization = false,
    stickyHeader = false,
    loading = false,
    className,
    paginationMode,
  } = props;

  // Toolbar controls this (density selector)
  const [tableSize, setTableSize] = React.useState<TableSize>(initialTableSize);

  const table = useDataTable(props);
  const parentRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <div className={cn('w-full space-y-4', className)}>
      <DataTableToolbar
        table={table}
        tableSize={tableSize}
        setTableSize={setTableSize}
        // Optionally allow this to be configured via props later:
        // searchColumn={props.searchColumn}
      />

      <div
        ref={parentRef}
        className={cn(
          'relative rounded-md border',
          enableVirtualization ? 'h-[600px] overflow-auto' : 'overflow-hidden',
          stickyHeader && 'relative',
        )}
      >
        <UiTable
          className={cn(tableSize === 'small' ? 'text-sm' : tableSize === 'large' ? 'text-lg' : '')}
        >
          <DataTableHeader table={table} sticky={stickyHeader} />

          {loading ? (
            <DataTableSkeleton columnCount={props.columns.length} rowCount={10} />
          ) : enableVirtualization ? (
            <DataTableVirtualBody
              table={table}
              parentRef={parentRef}
              rows={props.data}
              isLoading={loading}
              tableSize={tableSize}
            />
          ) : (
            <DataTableBody table={table} isLoading={loading} columns={props.columns} />
          )}
        </UiTable>
      </div>

      {paginationMode !== 'none' && (
        <DataTablePagination table={table} paginationMode={paginationMode} />
      )}
    </div>
  );
}
