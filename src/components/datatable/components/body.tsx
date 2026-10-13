import { type ColumnDef, type Table } from '@tanstack/react-table';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { DataTableContentCell } from './index';

interface DataTableBodyProps<TData, TValue> {
  table: Table<TData>;
  isLoading: boolean;
  columns: ColumnDef<TData, TValue>[];
  emptyMessage?: string;
}

export function DataTableBody<TData, TValue>({
  table,
  isLoading,
  emptyMessage = 'No results.',
}: DataTableBodyProps<TData, TValue>) {
  const rows = table.getRowModel().rows;

  if (isLoading) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
            Loading...
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (!rows?.length) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
            {emptyMessage}
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
          {row.getVisibleCells().map((cell) => (
            <DataTableContentCell key={cell.id} cell={cell} />
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}
