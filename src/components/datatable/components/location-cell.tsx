import { flexRender, type Cell } from '@tanstack/react-table';
import { TableCell } from '@/components/ui/table';
import { isLocationColumn } from '@/lib/location-display';

export { isLocationColumn } from '@/lib/location-display';

export function DataTableContentCell<TData>({ cell }: { cell: Cell<TData, unknown> }) {
  const wraps = isLocationColumn(cell.column.id, cell.column.columnDef.header);
  const content = flexRender(cell.column.columnDef.cell, cell.getContext());
  return (
    <TableCell className={wraps ? 'max-w-60 whitespace-normal' : undefined}>
      {wraps ? (
        <div className="w-56 max-w-full whitespace-normal [overflow-wrap:anywhere] [&_*]:whitespace-normal">
          {content}
        </div>
      ) : (
        content
      )}
    </TableCell>
  );
}
