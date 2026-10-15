import type React from 'react';
import { type Table } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TableBody, TableRow } from '@/components/ui/table';
import { DataTableContentCell } from './index';
import { type TableSize } from '../types';

interface DataTableVirtualBodyProps<TData> {
  table: Table<TData>;
  parentRef: React.RefObject<HTMLDivElement | null>;
  tableSize: TableSize;
}

export function DataTableVirtualBody<TData>({
  table,
  parentRef,
  tableSize,
}: DataTableVirtualBodyProps<TData>) {
  const { rows } = table.getRowModel();

  const estimateSize = () => {
    switch (tableSize) {
      case 'small':
        return 32;
      case 'large':
        return 64;
      default:
        return 48;
    }
  };

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 10,
  });

  // ...existing code...
  return (
    <TableBody
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        position: 'relative',
      }}
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const row = rows[virtualRow.index];
        return (
          <TableRow
            key={row?.id}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            data-state={row?.getIsSelected() && 'selected'}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              minHeight: `${estimateSize()}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {row?.getVisibleCells().map((cell) => (
              <DataTableContentCell key={cell.id} cell={cell} />
            ))}
          </TableRow>
        );
      })}
    </TableBody>
  );
}
