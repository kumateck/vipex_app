import { type ColumnDef, type Table, flexRender } from '@tanstack/react-table';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';

interface DataTableBodyProps<TData, TValue> {
  table: Table<TData>;
  isLoading: boolean;
  columns: ColumnDef<TData, TValue>[];
}

export function DataTableBody<TData, TValue>({
  table,
  isLoading,
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
            No results.
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
            <TableCell key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}
