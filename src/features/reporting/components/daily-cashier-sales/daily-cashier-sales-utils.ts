import { CashierType, PaymentComponent } from '@/db/schemas/enums';
import type { DailyCashierSalesTransactionRow } from '@/features/reporting/api/reporting.api';
import type { DailyCashierSalesDisplayTransaction } from './daily-cashier-sales-types';
import { formatDateTime as sharedFormatDateTime } from '@/lib/dates';

export function groupDeliveryCashierTransactions(
  transactions: DailyCashierSalesTransactionRow[],
): DailyCashierSalesDisplayTransaction[] {
  const rows: DailyCashierSalesDisplayTransaction[] = [];
  const deliveryGroupIndexes = new Map<string, number>();

  for (const transaction of transactions) {
    const isDeliveryCashierGroup = transaction.cashierType === CashierType.DELIVERY;
    const toBePaidAmountPsw =
      isDeliveryCashierGroup && transaction.component === PaymentComponent.PRINCIPAL
        ? transaction.grossAmountPsw
        : 0;
    const deliveryFeeAmountPsw =
      isDeliveryCashierGroup && transaction.component === PaymentComponent.DELIVERY_FEE
        ? transaction.grossAmountPsw
        : 0;
    const displayTransaction = {
      ...transaction,
      paymentIds: [transaction.paymentId],
      isDeliveryCashierGroup,
      toBePaidAmountPsw,
      deliveryFeeAmountPsw,
    };

    if (!isDeliveryCashierGroup) {
      rows.push(displayTransaction);
      continue;
    }

    const groupKey = [
      transaction.sessionId ?? 'no-session',
      transaction.cashierId ?? 'no-cashier',
      transaction.bookingCode,
      transaction.method,
    ].join(':');
    const existingIndex = deliveryGroupIndexes.get(groupKey);
    if (existingIndex === undefined) {
      deliveryGroupIndexes.set(groupKey, rows.length);
      rows.push(displayTransaction);
      continue;
    }

    const existing = rows[existingIndex];
    if (!existing) {
      deliveryGroupIndexes.set(groupKey, rows.length);
      rows.push(displayTransaction);
      continue;
    }
    rows[existingIndex] = {
      ...existing,
      paymentIds: [...existing.paymentIds, transaction.paymentId],
      grossAmountPsw: existing.grossAmountPsw + transaction.grossAmountPsw,
      netAmountPsw: existing.netAmountPsw + transaction.netAmountPsw,
      taxTotalPsw: existing.taxTotalPsw + transaction.taxTotalPsw,
      toBePaidAmountPsw: existing.toBePaidAmountPsw + toBePaidAmountPsw,
      deliveryFeeAmountPsw: existing.deliveryFeeAmountPsw + deliveryFeeAmountPsw,
    };
  }

  return rows;
}

export function todayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function parseDateInputValue(value: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function toDateInputValue(date?: Date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatMoneyPsw(amountPsw?: number | null, currencyCode = 'GHS') {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amountPsw ?? 0) / 100);
}

export function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return sharedFormatDateTime(value);
}
