import type { DateRange } from 'react-day-picker';

const pad = (value: number) => String(value).padStart(2, '0');

/** Local calendar date as YYYY-MM-DD (the API's date format). */
export function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export type SpendPreset = 'this-month' | 'last-month';

export function presetRange(preset: SpendPreset, today = new Date()): DateRange {
  const offset = preset === 'last-month' ? 1 : 0;
  const from = new Date(today.getFullYear(), today.getMonth() - offset, 1);
  const to = preset === 'last-month' ? new Date(today.getFullYear(), today.getMonth(), 0) : today;
  return { from, to };
}

/** API params for a complete range, or null while the user is still picking. */
export function rangeToParams(range: DateRange | undefined) {
  if (!range?.from || !range.to) return null;
  return { from: toIsoDate(range.from), to: toIsoDate(range.to) };
}
