import type { ParcelStorageClearanceRow } from '../types';
import {
  STORAGE_CLEARANCE_ACTION_STATUSES,
  STORAGE_CLEARANCE_STATUS_DESCRIPTIONS,
  STORAGE_CLEARANCE_STATUS_LABELS,
} from '../constants';

export function formatStorageMoney(amountPsw: number | null | undefined) {
  return `GHS ${((amountPsw ?? 0) / 100).toFixed(2)}`;
}

export function formatStorageClearanceStatus(status: number) {
  return STORAGE_CLEARANCE_STATUS_LABELS[status] ?? `Status ${status}`;
}

export function storageClearanceLabel(row: ParcelStorageClearanceRow) {
  return `${row.bookingCode} · ${row.trackingCode}`;
}

export function describeStorageClearanceStatus(status: number) {
  return STORAGE_CLEARANCE_STATUS_DESCRIPTIONS[status] ?? '';
}

export function isStorageClearanceActionAllowed(action: string, status: number) {
  return STORAGE_CLEARANCE_ACTION_STATUSES[action]?.includes(status) ?? false;
}
