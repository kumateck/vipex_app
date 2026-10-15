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
