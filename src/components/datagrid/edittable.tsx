import React, { useState, useEffect, useCallback } from 'react';
import { type Column, type Row, type Table } from '@tanstack/react-table';

interface EditableCellProps<TData> {
  getValue: () => unknown;
  row: Row<TData>;
  column: Column<TData, unknown>;
  table: Table<TData>;
}

const EditableCell = <TData,>({ getValue, row, column, table }: EditableCellProps<TData>) => {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);
  // Access enableEditing from table meta
  const isEditingEnabled = table.options.meta?.enableEditing;

  // Sync state if external data changes (e.g. from AI update)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const onBlur = useCallback(() => {
    if (value !== initialValue) {
      table.options.meta?.updateData(row.index, column.id, value);
    }
  }, [value, initialValue, row.index, column.id, table.options.meta]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const isNumber = typeof initialValue === 'number';

  // If editing is disabled globally or for this column (could expand logic), render display only
  if (!isEditingEnabled) {
    return (
      <div
        className={`w-full h-full px-3 py-2 truncate text-sm flex items-center ${isNumber ? 'justify-end font-mono text-muted-foreground' : 'text-foreground'}`}
      >
        {value as React.ReactNode}
      </div>
    );
  }

  return (
    <input
      id={`editable-cell-input-${row.index}-${column.id}"`}
      value={value as string}
      onChange={(e) => setValue(e.target.value)}
      onBlur={onBlur}
      onKeyDown={handleKeyDown}
      className={`w-full h-full bg-transparent px-3 py-2 outline-none focus:ring-1 focus:ring-ring focus:bg-background focus:text-foreground focus:z-10 absolute inset-0 text-sm transition-colors ${
        isNumber ? 'text-right font-mono text-primary' : 'text-left text-foreground'
      }`}
    />
  );
};

export default React.memo(EditableCell);
