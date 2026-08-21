import { ParcelReconciliationActionType, ParcelReconciliationCaseType } from '@/db/schemas/enums';
import { formatDateTime } from '@/lib/dates';
import type { ParcelSearchRow } from '../../api/parcel.api';
import { ACTION_OPTIONS } from './constants';

const DUPLICATE_ENTRY_ACTION_TYPES = new Set<number>([
  ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE,
  ParcelReconciliationActionType.MERGE_TO_SINGLE,
]);

const MONEY_FORMATTER = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
});

export function formatMoneyPsw(amountPsw: number | null | undefined) {
  return MONEY_FORMATTER.format(Number(amountPsw ?? 0) / 100);
}

export function formatReconciliationDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return formatDateTime(date);
}

export function parcelSelectLabel(parcel: ParcelSearchRow) {
  const senderDisplay = [parcel.senderName, parcel.senderPhone ? `(${parcel.senderPhone})` : null]
    .filter(Boolean)
    .join(' ');
  return `${parcel.bookingCode}${senderDisplay ? ` • ${senderDisplay}` : ''}`;
}

export async function toDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed reading file: ${file.name}`));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  });
}

export function getActionOptionsForCaseType(caseType: number) {
  return ACTION_OPTIONS.filter((option) =>
    caseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY
      ? DUPLICATE_ENTRY_ACTION_TYPES.has(option.value)
      : !DUPLICATE_ENTRY_ACTION_TYPES.has(option.value) &&
        (option.value !== ParcelReconciliationActionType.CORRECT_AMOUNT_IN_ORIGINAL_SESSION ||
          caseType === ParcelReconciliationCaseType.WRONG_AMOUNT ||
          caseType === ParcelReconciliationCaseType.DATA_ENTRY_ERROR),
  );
}

export function getDefaultActionTypeForCaseType(caseType: number) {
  if (caseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY) {
    return ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE;
  }
  if (
    caseType === ParcelReconciliationCaseType.WRONG_AMOUNT ||
    caseType === ParcelReconciliationCaseType.DATA_ENTRY_ERROR
  ) {
    return ParcelReconciliationActionType.CORRECT_AMOUNT_IN_ORIGINAL_SESSION;
  }
  return ParcelReconciliationActionType.VOID_AND_REFUND;
}
