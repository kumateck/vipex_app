import { memo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { messageLabel } from '../../types';

// Radix Select cannot use an empty string as an item value.
const ALL = '__all__';

type MessageOptionSelectProps<T extends string> = {
  label: string;
  options: readonly T[];
  value: T | '';
  onChange: (value: T | '') => void;
  allLabel?: string;
  disabled?: boolean;
};

function MessageOptionSelectInner<T extends string>({
  label,
  options,
  value,
  onChange,
  allLabel,
  disabled,
}: MessageOptionSelectProps<T>) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <Select
        value={value || ALL}
        onValueChange={(next) => onChange(next === ALL ? '' : (next as T))}
        disabled={disabled}
      >
        <SelectTrigger className="mt-1 min-w-44 capitalize" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allLabel ? <SelectItem value={ALL}>{allLabel}</SelectItem> : null}
          {options.map((option) => (
            <SelectItem key={option} value={option} className="capitalize">
              {messageLabel(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

export const MessageOptionSelect = memo(
  MessageOptionSelectInner,
) as typeof MessageOptionSelectInner;
