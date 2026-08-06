import { ParcelReconciliationActionType, ParcelReconciliationCaseType } from '@/db/schemas/enums';
import { formatDateTime } from '@/lib/dates';
import type { SenderCashierParcel } from '../../api/parcel.api';
import { RECON_ACTION_OPTIONS } from './constants';

const DUPLICATE_ENTRY_ACTION_TYPES = new Set<number>([
  ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE,
  ParcelReconciliationActionType.MERGE_TO_SINGLE,
]);

export const formatCurrency = (amountPsw: number) => `GHS ${(amountPsw / 100).toFixed(2)}`;

export function formatPhones(primary?: string | null, secondary?: string | null) {
  const phones = [primary, secondary].filter((value): value is string => Boolean(value?.trim()));
  return phones.length ? phones.join(', ') : '-';
}

export function formatSenderParcelDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '-';
  return formatDateTime(date);
}

export function getSenderDuePsw(parcel: SenderCashierParcel) {
  return Math.max(parcel.chargePsw - (parcel.plannedToBePaidPsw ?? 0), 0);
}

export function getPaymentType(parcel: SenderCashierParcel) {
  const charge = Number(parcel.chargePsw ?? 0);
  const receiverDue = Math.max(Number(parcel.plannedToBePaidPsw ?? 0), 0);

  if (receiverDue <= 0) {
    return { dotClassName: 'bg-emerald-500' };
  }

  if (receiverDue >= charge) {
    return { dotClassName: 'bg-amber-500' };
  }

  return { dotClassName: 'bg-sky-500' };
}

export async function toDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed reading file: ${file.name}`));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  });
}

export function getReconciliationActionOptions(caseType: number) {
  return RECON_ACTION_OPTIONS.filter((option) =>
    caseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY
      ? DUPLICATE_ENTRY_ACTION_TYPES.has(option.value)
      : !DUPLICATE_ENTRY_ACTION_TYPES.has(option.value),
  );
}
