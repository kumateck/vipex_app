import { Payer, PaymentComponent, PaymentMethod } from '@/db/schemas/enums';
import { formatDateTime } from '@/lib/dates';
import type { ParcelHistoryEvent } from '../types';

export const formatMoney = (psw: number | null | undefined) =>
  `GHS ${(Number(psw ?? 0) / 100).toFixed(2)}`;

export function formatWhen(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : formatDateTime(date);
}

export function joinPhones(...phones: Array<string | null | undefined>) {
  return phones.filter(Boolean).join(' / ') || '-';
}

export function personName(userNames: Record<string, string>, id: string | null | undefined) {
  if (!id) return '-';
  return userNames[id] ?? 'Unknown user';
}

export const paymentComponentLabel = (component: number) =>
  component === PaymentComponent.PRINCIPAL
    ? 'Parcel charge'
    : component === PaymentComponent.DELIVERY_FEE
      ? 'Delivery fee'
      : 'Other';

export const payerLabel = (payer: number) =>
  payer === Payer.SENDER ? 'Sender' : payer === Payer.RECIPIENT ? 'Receiver' : '-';

export function paymentMethodName(method: number) {
  const name = PaymentMethod[method];
  if (typeof name !== 'string') return String(method);
  return name === 'CASH' ? 'Cash' : name;
}

/** Groups history newest-day first, oldest-first within each day, keyed by local date. */
export function groupHistoryByDay(events: ParcelHistoryEvent[]) {
  const groups = new Map<string, ParcelHistoryEvent[]>();
  for (const event of events) {
    const date = new Date(event.occurredAt);
    const key = Number.isNaN(date.getTime())
      ? 'Unknown date'
      : date.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }
  return [...groups.entries()].map(([day, items]) => ({ day, items })).toReversed();
}
