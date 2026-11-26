import { ParcelStorageClearanceStatus } from '@/db/schemas/enums';

export const STORAGE_CLEARANCE_STATUS_LABELS: Record<number, string> = {
  [ParcelStorageClearanceStatus.PENDING_APPROVAL]: 'Pending Approval',
  [ParcelStorageClearanceStatus.APPROVED_FOR_FINANCE]: 'Approved for Finance',
  [ParcelStorageClearanceStatus.RETURNED_FOR_REVIEW]: 'Returned for Review',
  [ParcelStorageClearanceStatus.REJECTED]: 'Rejected',
  [ParcelStorageClearanceStatus.EXECUTED]: 'Executed',
};

export const STORAGE_CLEARANCE_STATUS_OPTIONS = Object.entries(STORAGE_CLEARANCE_STATUS_LABELS).map(
  ([value, label]) => ({ value: Number(value), label }),
);

/** Plain-language meaning shown under each status so users know what happens next. */
export const STORAGE_CLEARANCE_STATUS_DESCRIPTIONS: Record<number, string> = {
  [ParcelStorageClearanceStatus.PENDING_APPROVAL]:
    'Waiting for an approver. Storage is still owed.',
  [ParcelStorageClearanceStatus.APPROVED_FOR_FINANCE]:
    'Approved. Waiting for finance to execute. Storage is still owed.',
  [ParcelStorageClearanceStatus.RETURNED_FOR_REVIEW]:
    'Finance sent it back. The requester must review and resubmit.',
  [ParcelStorageClearanceStatus.REJECTED]: 'Closed without clearing. Storage is still owed.',
  [ParcelStorageClearanceStatus.EXECUTED]:
    'Cleared. The amount is removed from the parcel storage balance.',
};

/** Statuses from which each action may run; executed and rejected requests are final. */
export const STORAGE_CLEARANCE_ACTION_STATUSES: Record<string, number[]> = {
  approve: [ParcelStorageClearanceStatus.PENDING_APPROVAL],
  reject: [
    ParcelStorageClearanceStatus.PENDING_APPROVAL,
    ParcelStorageClearanceStatus.APPROVED_FOR_FINANCE,
  ],
  return: [ParcelStorageClearanceStatus.APPROVED_FOR_FINANCE],
  execute: [ParcelStorageClearanceStatus.APPROVED_FOR_FINANCE],
};
