import type { CashierSessionSummary } from '../types';

const moneyFormatter = new Intl.NumberFormat('en-GH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoneyPsw(value?: number | null): string {
  return `GH₵ ${moneyFormatter.format(Number(value ?? 0) / 100)}`;
}

export function formatDashboardDate(date: Date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatSessionDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function isActiveSession(status?: string | null): boolean {
  return (status ?? '').trim().toUpperCase() === 'ACTIVE';
}

export function cashierSummaryMode(cashierType?: number | null) {
  if (cashierType === 0) return 'sender' as const;
  if (cashierType === 1) return 'receiver' as const;
  if (cashierType === 2) return 'delivery' as const;
  return 'full' as const;
}

export function expectedClosingBalancePsw(
  summary: CashierSessionSummary | null,
  cashierType?: number | null,
): number {
  const mode = cashierSummaryMode(cashierType);
  if (mode === 'receiver') return summary?.totalToBePaidCollectedPsw ?? 0;
  if (mode === 'delivery') {
    return (summary?.totalDeliveryFeeCollectedPsw ?? 0) + (summary?.totalToBePaidCollectedPsw ?? 0);
  }
  if (mode === 'full') return summary?.totalFullCashierExpectedPsw ?? 0;
  return summary?.amountPaidPsw ?? 0;
}
