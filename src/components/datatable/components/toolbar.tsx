import { type Table } from '@tanstack/react-table';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTableViewOptions } from './view';
import type { TableSize } from '../types';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  tableSize: TableSize;
  setTableSize: (size: TableSize) => void;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  searchPlaceholder?: string;
  searchColumn?: string;
  showSearch?: boolean;
}

export function DataTableToolbar<TData>({
  table,
  tableSize,
  setTableSize,
  globalFilter,
  setGlobalFilter,
  searchPlaceholder,
  searchColumn,
  showSearch = true,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0 || globalFilter.length > 0;
  const useColumnSearch = Boolean(searchColumn) && !table.options.manualFiltering;
  const canSearch = showSearch && (Boolean(searchColumn) || table.getAllLeafColumns().length > 0);

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex flex-1 items-center space-x-2">
        {canSearch ? (
          useColumnSearch && searchColumn ? (
            <Input
              placeholder={searchPlaceholder ?? `Filter ${searchColumn}...`}
              value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ''}
              onChange={(event) => table.getColumn(searchColumn)?.setFilterValue(event.target.value)}
              className="h-8 w-[150px] lg:w-[250px]"
            />
          ) : (
            <Input
              placeholder={searchPlaceholder ?? 'Search...'}
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="h-8 w-[150px] lg:w-[250px]"
            />
          )
        ) : null}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              setGlobalFilter('');
            }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {/* Table Density Selector */}
        <Select value={tableSize} onValueChange={(value) => setTableSize(value as TableSize)}>
          <SelectTrigger className="h-8 w-[100px]">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Compact</SelectItem>
            <SelectItem value="medium">Default</SelectItem>
            <SelectItem value="large">Relaxed</SelectItem>
          </SelectContent>
        </Select>

        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
