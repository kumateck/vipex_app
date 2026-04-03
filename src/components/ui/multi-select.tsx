'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './badge';
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

type BaseOption = object;

export type MultiSelectProps<T extends BaseOption> = {
  options: T[];
  value: string[];
  onValueChange: (next: string[]) => void;
  getLabel: (option: T) => string;
  getValue: (option: T) => string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
};

export function MultiSelect<T extends BaseOption>({
  options,
  value,
  onValueChange,
  getLabel,
  getValue,
  placeholder = 'Select options',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No options found.',
  disabled,
  className,
}: MultiSelectProps<T>) {
  const [open, setOpen] = React.useState(false);

  const selectedOptions = React.useMemo(() => {
    const selected = new Set(value);
    return options.filter((option) => selected.has(getValue(option)));
  }, [getValue, options, value]);

  const toggle = React.useCallback(
    (nextValue: string) => {
      if (value.includes(nextValue)) {
        onValueChange(value.filter((item) => item !== nextValue));
        return;
      }
      onValueChange([...value, nextValue]);
    },
    [onValueChange, value],
  );

  const remove = React.useCallback(
    (removeValue: string) => {
      onValueChange(value.filter((item) => item !== removeValue));
    },
    [onValueChange, value],
  );

  const triggerLabel = React.useMemo(() => {
    if (!selectedOptions.length) return placeholder;
    if (selectedOptions.length <= 2) {
      return selectedOptions.map((option) => getLabel(option)).join(', ');
    }
    return `${selectedOptions.length} selected`;
  }, [getLabel, placeholder, selectedOptions]);

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
          <span className="truncate">{triggerLabel}</span>
          <ChevronsUpDown className="text-muted-foreground ml-2 size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const optionValue = getValue(option);
                const isSelected = value.includes(optionValue);

                return (
                  <CommandItem
                    key={optionValue}
                    value={`${getLabel(option)} ${optionValue}`}
                    onSelect={() => toggle(optionValue)}
                    className={cn(
                      'flex items-center justify-between border border-transparent',
                      isSelected && 'border-primary/40 bg-primary/10 text-primary',
                    )}
                  >
                    <span className="flex min-w-0 items-center">
                      <Check
                        className={cn('mr-2 size-4', isSelected ? 'opacity-100' : 'opacity-20')}
                      />
                      <span className="truncate">{getLabel(option)}</span>
                    </span>
                    {isSelected ? (
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-primary/90">
                        Selected
                      </span>
                    ) : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        {selectedOptions.length ? (
          <div className="border-t p-2">
            <div className="flex flex-wrap gap-1">
              {selectedOptions.map((option) => {
                const optionValue = getValue(option);
                return (
                  <Badge key={optionValue} variant="secondary" className="gap-1">
                    <span className="max-w-[170px] truncate">{getLabel(option)}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${getLabel(option)}`}
                      className="rounded-sm p-0.5 hover:bg-background/60"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        remove(optionValue);
                      }}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
