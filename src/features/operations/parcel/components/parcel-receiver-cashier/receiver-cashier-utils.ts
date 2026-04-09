import { formatDateTime as formatDateTimeStandard } from '@/lib/date';
import type { ParcelSearchRow } from '../../api/parcel.api';

export function formatCurrency(amountPsw: number) {
  return `GHS ${(amountPsw / 100).toFixed(2)}`;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return formatDateTimeStandard(date);
}

export function formatStorageCharge(parcel: ParcelSearchRow) {
  return formatCurrency(parcel.storageChargePsw ?? 0);
}

export function formatPhones(primary?: string | null, secondary?: string | null) {
  const phones = [primary, secondary].filter((value): value is string => Boolean(value?.trim()));
  return phones.length ? phones.join(', ') : '-';
}

export function getQueueFilterBySearch(isPickupQueueEnabled: boolean, search?: string) {
  if (!isPickupQueueEnabled) return undefined;
  return search?.trim() ? undefined : true;
}

export function getPaymentType(row: Pick<ParcelSearchRow, 'chargePsw' | 'plannedToBePaidPsw'>) {
  const charge = Number(row.chargePsw ?? 0);
  const receiverDue = Math.max(Number(row.plannedToBePaidPsw ?? 0), 0);

  if (receiverDue >= charge) {
    return { dotClassName: 'bg-amber-500' };
  }

  return { dotClassName: 'bg-sky-500' };
}
