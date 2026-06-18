import type { CustomerStatement } from '@/features/customers/api';
import { formatDateTime } from '@/lib/dates';

export function formatMoney(psw: number) {
  return `GHS ${(psw / 100).toFixed(2)}`;
}

export function toDateTimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function toIso(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

export function paymentMethodLabel(method: number | null) {
  if (method == null) return '-';
  if (method === 0) return 'Cash';
  if (method === 1) return 'MTN';
  if (method === 2) return 'Telecel';
  if (method === 3) return 'Airtel';
  if (method === 4) return 'Credit';
  return `Method ${method}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return formatDateTime(date);
}

export function buildStatementRowsWithRunningBalance(statement: CustomerStatement | undefined) {
  if (!statement?.rows?.length) return [];
  const ascRows = [...statement.rows].sort((a, b) => {
    if (a.timestamp === b.timestamp) return a.id > b.id ? 1 : -1;
    return a.timestamp > b.timestamp ? 1 : -1;
  });

  let runningBalancePsw = statement.summary.openingCreditBalancePsw ?? 0;
  const withBalance = ascRows.map((row) => {
    const isCreditLedgerEntry = row.entryType === 'CREDIT';
    if (isCreditLedgerEntry && row.direction === 'debit' && row.amountPsw != null) {
      runningBalancePsw += row.amountPsw;
    }
    if (isCreditLedgerEntry && row.direction === 'credit' && row.amountPsw != null) {
      runningBalancePsw -= row.amountPsw;
    }
    return {
      ...row,
      runningBalancePsw,
    };
  });

  return withBalance.sort((a, b) => {
    if (a.timestamp === b.timestamp) return a.id < b.id ? 1 : -1;
    return a.timestamp < b.timestamp ? 1 : -1;
  });
}
