import { type Table, flexRender } from '@tanstack/react-table';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface DataTableHeaderProps<TData> {
  table: Table<TData>;
  sticky?: boolean;
}

export function DataTableHeader<TData>({ table, sticky }: DataTableHeaderProps<TData>) {
  return (
    <TableHeader className={cn(sticky && 'sticky top-0 z-10 bg-background shadow-sm')}>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            return (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            );
          })}
        </TableRow>
      ))}
    </TableHeader>
  );
}
