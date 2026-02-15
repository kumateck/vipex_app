import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type RowData,
  getSortedRowModel,
  type SortingState,
  type Row,
  type RowSelectionState,
  type CellContext,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';

import EditableCell from './edittable';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Checkbox } from '../ui';

// ----------------------------------------------------------------------------
// Types & Module Augmentation
// ----------------------------------------------------------------------------

declare module '@tanstack/table-core' {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
    removeRow: (rowId: string) => void;
    enableEditing: boolean;
    rowData?: TData;
  }
}

export interface DataGridProps<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  onDataChange?: (data: TData[]) => void;
  onDeleteRow?: (rowId: string) => void;
  enableSelection?: boolean;
  enableEditing?: boolean;
  getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string;
}

// ----------------------------------------------------------------------------
// Internal Components
// ----------------------------------------------------------------------------

const IndeterminateCheckbox = ({
  indeterminate,
  className = '',
  onChange,
  checked,
  disabled,
  ...rest
}: {
  indeterminate?: boolean;
  className?: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
} & Omit<
  React.ComponentPropsWithoutRef<typeof Checkbox>,
  'checked' | 'onCheckedChange' | 'disabled'
>) => {
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <Checkbox
      ref={ref}
      className={className}
      disabled={disabled}
      checked={indeterminate ? 'indeterminate' : !!checked}
      aria-checked={indeterminate ? 'mixed' : !!checked}
      onCheckedChange={(value) => {
        // TanStack provides an onChange handler expecting a ChangeEvent<HTMLInputElement>.
        // We adapt shadcn/radix boolean | "indeterminate" into that shape.
        const event = {
          target: { checked: value === true },
          currentTarget: { checked: value === true },
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        onChange?.(event);
      }}
      {...rest}
    />
  );
};

// ----------------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------------

export function DataGrid<TData extends { id: string | number }, TValue>({
  data,
  columns: userColumns,
  onDataChange,
  onDeleteRow,
  enableSelection = false,
  enableEditing = false,
  getRowId,
}: DataGridProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [deletingRowIds, setDeletingRowIds] = useState<Set<string>>(new Set());

  const tableContainerRef = useRef<HTMLDivElement>(null);

  // --------------------------------------------------------------------------
  // Columns Setup
  // --------------------------------------------------------------------------
  const columns = useMemo(() => {
    let cols = [...userColumns];

    if (enableSelection) {
      const selectionColumn: ColumnDef<TData> = {
        id: 'select',
        size: 40,
        enableResizing: false,
        header: ({ table }) => (
          <div className="flex items-center justify-center w-full h-full">
            <IndeterminateCheckbox
              {...{
                checked: table.getIsAllRowsSelected(),
                indeterminate: table.getIsSomeRowsSelected(),
                onChange: table.getToggleAllRowsSelectedHandler(),
              }}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center w-full h-full">
            <IndeterminateCheckbox
              {...{
                checked: row.getIsSelected(),
                disabled: !row.getCanSelect(),
                indeterminate: row.getIsSomeSelected(),
                onChange: row.getToggleSelectedHandler(),
              }}
            />
          </div>
        ),
      };
      cols.unshift(selectionColumn);
    }

    return cols;
  }, [userColumns, enableSelection]);

  // --------------------------------------------------------------------------
  // Table Logic
  // --------------------------------------------------------------------------

  const updateData = useCallback(
    (rowIndex: number, columnId: string, value: unknown) => {
      if (!onDataChange) return;

      const newData = data.map((row, index) => {
        if (index === rowIndex) {
          return {
            ...row,
            [columnId]: value,
          };
        }
        return row;
      });

      onDataChange(newData);
    },
    [data, onDataChange],
  );

  const removeRow = useCallback(
    (rowId: string) => {
      setDeletingRowIds((prev) => {
        const next = new Set(prev);
        next.add(rowId);
        return next;
      });

      // Match transition duration
      setTimeout(() => {
        if (onDeleteRow) {
          onDeleteRow(rowId);
        }
        setDeletingRowIds((prev) => {
          const next = new Set(prev);
          next.delete(rowId);
          return next;
        });
        setRowSelection((prev) => {
          const next = { ...prev };
          delete next[rowId];
          return next;
        });
      }, 600);
    },
    [onDeleteRow],
  );
  const defaultEditableCell = useMemo(() => {
    return (ctx: CellContext<TData, unknown>) => <EditableCell {...(ctx as any)} />;
  }, []);

  const table = useReactTable({
    data,
    columns,
    getRowId: getRowId || ((row: any) => String(row.id)),
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: enableSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    defaultColumn: {
      cell: defaultEditableCell,
      size: 150,
    },
    meta: {
      updateData,
      removeRow,
      enableEditing,
    },
    autoResetPageIndex: false,
  });

  const { rows } = table.getRowModel();

  // --------------------------------------------------------------------------
  // Virtualization
  // --------------------------------------------------------------------------
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 36,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows[0]?.start ?? 0;
  const lastVirtualRow = virtualRows.length > 0 ? virtualRows[virtualRows.length - 1] : undefined;
  const paddingBottom = lastVirtualRow ? totalSize - (lastVirtualRow.end ?? 0) : 0;

  return (
    <div className="h-full flex flex-col bg-card border border-border rounded-lg overflow-hidden group min-h-0 shadow-xs">
      <div ref={tableContainerRef} className="flex-1 overflow-auto relative w-full scroll-smooth">
        <table
          className="border-collapse text-sm table-fixed bg-card min-w-full"
          style={{ width: table.getTotalSize() }}
        >
          {/* Header updated: Muted background, Foreground text, clean borders */}
          <thead className="sticky top-0 z-20 bg-muted/50 backdrop-blur-sm text-left shadow-xs">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="h-8 border-b border-border">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="relative px-2 py-0.5 font-semibold text-muted-foreground select-none group-header border-r border-border last:border-r-0"
                    style={{ width: header.getSize() }}
                  >
                    <div
                      className={`flex items-center gap-1 h-full ${header.column.getCanSort() ? 'cursor-pointer hover:text-foreground transition-colors' : ''}`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-xs text-muted-foreground w-4">
                          {{
                            asc: <ArrowUp className="ml-2 h-4 w-4" />,
                            desc: <ArrowDown className="ml-2 h-4 w-4" />,
                          }[header.column.getIsSorted() as string] ?? ''}
                        </span>
                      )}
                    </div>
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={`absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-ring/50 opacity-0 hover:opacity-100 ${header.column.getIsResizing() ? 'bg-ring opacity-100' : ''}`}
                    />
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} colSpan={columns.length} />
              </tr>
            )}

            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];

              if (!row) {
                return null;
              }

              const isDeleting = deletingRowIds.has(row.id);
              const isSelected = row.getIsSelected();

              const rowClasses = `
                        border-b border-border last:border-0
                        ${isSelected ? 'bg-background' : 'hover:bg-muted/40'}
                        ${isDeleting ? 'pointer-events-none' : ''}
                        transition-colors duration-150
                    `;

              return (
                <motion.tr
                  key={row.id}
                  className={rowClasses}
                  initial={{ opacity: 1, filter: 'blur(0px)' }}
                  animate={{
                    opacity: isDeleting ? 0 : 1,
                    backgroundColor: isDeleting ? 'var(--destructive)' : undefined, // Using css var if possible or fallback
                    filter: isDeleting ? 'blur(2px)' : 'blur(0px)',
                  }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <motion.td
                      key={cell.id}
                      className={`relative p-0 border-r border-border last:border-r-0 focus-within:z-10 ${isSelected ? 'border-primary/10' : ''}`}
                      style={{ width: cell.column.getSize(), overflow: 'hidden' }}
                      initial={{ height: 36, opacity: 1 }}
                      animate={{
                        height: isDeleting ? 0 : 36,
                        borderBottomWidth: isDeleting ? 0 : 1,
                        opacity: isDeleting ? 0 : 1,
                      }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </motion.td>
                  ))}
                </motion.tr>
              );
            })}

            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} colSpan={columns.length} />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="h-10 bg-muted/20 border-t border-border flex items-center px-4 text-xs text-muted-foreground font-medium justify-between z-20 shrink-0 select-none sticky bottom-0">
        <div className="flex gap-4">
          <span className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${Object.keys(rowSelection).length > 0 ? 'bg-primary' : 'bg-green-500'}`}
            ></div>
            {Object.keys(rowSelection).length > 0
              ? `${Object.keys(rowSelection).length} selected`
              : 'Ready'}
          </span>
          <span className="text-border">|</span>
          <span>{rows.length.toLocaleString()} records</span>
        </div>
        <div className="flex gap-4">
          {Object.keys(rowSelection).length > 0 && (
            <span className="text-primary hover:text-primary/80 cursor-pointer transition-colors">
              Batch Actions Available
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
