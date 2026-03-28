'use client';

import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import * as React from 'react';

import { useCreatableCombobox, type BaseOption } from '@/hooks/use-creatable-combobox';
import { cn } from '@/lib/utils';

import { Button } from './button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export type CreateStrategy = 'inline' | 'modal';

export type CreatableComboboxProps<T extends BaseOption> = {
  value?: string;
  onChange: (value: string, option?: T) => void;
  getLabel: (item: T) => string;
  getValue: (item: T) => string;
  options?: T[];
  fetchOptions?: (query: string) => Promise<T[]>;
  onCreate?: (input: string) => Promise<T>;
  allowCreate?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  createStrategy?: CreateStrategy;
  className?: string;
  debounceMs?: number;
};

export function CreatableCombobox<T extends BaseOption>({
  value,
  onChange,
  getLabel,
  getValue,
  options,
  fetchOptions,
  onCreate,
  allowCreate = true,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search or create...',
  emptyMessage = 'No options found.',
  disabled,
  createStrategy = 'inline',
  className,
  debounceMs,
}: CreatableComboboxProps<T>) {
  const [open, setOpen] = React.useState(false);
  const createEnabled = allowCreate && Boolean(onCreate);
  const createHandler = createEnabled ? onCreate : undefined;

  const {
    canCreate,
    create,
    creating,
    error,
    input,
    loading,
    mergedOptions,
    normalizedInput,
    setInput,
  } = useCreatableCombobox<T>({
    debounceMs,
    fetchOptions,
    getLabel,
    getValue,
    onCreate: createHandler,
    options,
  });

  const selectedOption = React.useMemo(
    () => mergedOptions.find((option) => getValue(option) === value),
    [getValue, mergedOptions, value],
  );

  const handleSelect = React.useCallback(
    (option: T) => {
      onChange(getValue(option), option);
      setOpen(false);
    },
    [getValue, onChange],
  );

  const handleCreate = React.useCallback(async () => {
    const newItem = await create();
    if (!newItem) {
      return;
    }

    onChange(getValue(newItem), newItem);
    setInput('');
    setOpen(false);
  }, [create, getValue, onChange, setInput]);

  const hasOptions = mergedOptions.length > 0;
  const disableCreateItem = !canCreate || creating;
  const showCreateInline =
    createEnabled && createStrategy === 'inline' && Boolean(normalizedInput) && !hasOptions;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between', className)}
        >
          <span className="truncate">
            {selectedOption ? getLabel(selectedOption) : placeholder}
          </span>
          <ChevronsUpDown className="text-muted-foreground ml-2 size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={input}
            onValueChange={setInput}
            placeholder={searchPlaceholder}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') {
                return;
              }

              if (hasOptions) {
                return;
              }

              if (canCreate && createStrategy === 'inline') {
                event.preventDefault();
                void handleCreate();
              }
            }}
          />
          <CommandList>
            {loading ? <CommandEmpty>Loading options...</CommandEmpty> : null}
            {!loading && error ? (
              <CommandEmpty className="text-destructive">{error}</CommandEmpty>
            ) : null}
            {!loading && !error && !hasOptions ? <CommandEmpty>{emptyMessage}</CommandEmpty> : null}

            {hasOptions ? (
              <CommandGroup>
                {mergedOptions.map((option) => {
                  const optionValue = getValue(option);
                  const isSelected = value === optionValue;

                  return (
                    <CommandItem
                      key={optionValue}
                      value={optionValue}
                      className="bg-transparent data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                      onSelect={() => handleSelect(option)}
                    >
                      <Check
                        className={cn('mr-2 size-4', isSelected ? 'opacity-100' : 'opacity-0')}
                        aria-hidden="true"
                      />
                      <span className="truncate">{getLabel(option)}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : null}

            {showCreateInline ? (
              <CommandGroup>
                <CommandItem
                  value={`create-${normalizedInput}`}
                  className="bg-transparent data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                  onSelect={() => {
                    void handleCreate();
                  }}
                  disabled={disableCreateItem}
                >
                  <Plus className="mr-2 size-4" aria-hidden="true" />
                  <span className="truncate">
                    {creating ? 'Creating...' : `Create "${input.trim()}"`}
                  </span>
                </CommandItem>
              </CommandGroup>
            ) : null}

            {createEnabled && createStrategy === 'modal' ? (
              <CommandGroup>
                <CommandItem value="create-modal" disabled>
                  <Plus className="mr-2 size-4" aria-hidden="true" />
                  <span className="truncate">Create via modal (stub)</span>
                </CommandItem>
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
