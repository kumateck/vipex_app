const moneyFormatter = new Intl.NumberFormat('en-GH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const PAYMENT_METHOD_LABELS: Record<number, string> = {
  0: 'Cash',
  1: 'MTN Mobile Money',
  2: 'Telecel Cash',
  3: 'AirtelTigo Cash',
  4: 'Credit',
};

function dateFromKey(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

export function toDateKey(value: Date = new Date()): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeDateKey(value?: string | null): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(dateFromKey(value).getTime())) {
    return value;
  }
  return toDateKey();
}

export function formatReportDate(value: string): string {
  return dateFromKey(value).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatReportDateTime(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatReportMoney(value?: number | null): string {
  return `GH₵ ${moneyFormatter.format(Number(value ?? 0) / 100)}`;
}

export function reportDateFromSession(value?: string | null): string {
  if (!value) return toDateKey();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? toDateKey() : toDateKey(date);
}

export type ReportCalendarDay = {
  key: string;
  day: number;
  inMonth: boolean;
  future: boolean;
};

export function monthKeyFromDate(value: string): string {
  return `${value.slice(0, 7)}-01`;
}

export function moveMonthKey(value: string, months: number): string {
  const date = dateFromKey(value);
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  return toDateKey(date);
}

export function formatMonth(value: string): string {
  return dateFromKey(value).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function buildCalendarDays(monthKey: string): ReportCalendarDay[] {
  const first = dateFromKey(monthKey);
  first.setDate(1 - first.getDay());
  const selectedMonth = dateFromKey(monthKey).getMonth();
  const today = toDateKey();
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(first);
    date.setDate(first.getDate() + index);
    const key = toDateKey(date);
    return {
      key,
      day: date.getDate(),
      inMonth: date.getMonth() === selectedMonth,
      future: key > today,
    };
  });
}
