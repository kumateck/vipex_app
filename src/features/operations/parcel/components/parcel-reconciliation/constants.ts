import { ParcelReconciliationActionType, ParcelReconciliationCaseType } from '@/db/schemas/enums';
import type { PaginationMeta } from '@/server/types/pagination.types';

export const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

export const CASE_TYPE_OPTIONS = [
  { value: ParcelReconciliationCaseType.SHORTAGE, label: 'Shortage' },
  { value: ParcelReconciliationCaseType.OVERAGE, label: 'Overage' },
  { value: ParcelReconciliationCaseType.WRONG_AMOUNT, label: 'Wrong Amount' },
  { value: ParcelReconciliationCaseType.WRONG_PARCEL_TYPE, label: 'Wrong Parcel Type' },
  { value: ParcelReconciliationCaseType.DUPLICATE_ENTRY, label: 'Double Entry' },
  {
    value: ParcelReconciliationCaseType.CUSTOMER_CANCELLATION_BEFORE_DELIVERY,
    label: 'Customer Cancellation Before Delivery',
  },
  { value: ParcelReconciliationCaseType.DATA_ENTRY_ERROR, label: 'Data Entry Error' },
] as const;

export const ACTION_OPTIONS = [
  { value: ParcelReconciliationActionType.VOID_AND_REFUND, label: 'Void and Refund' },
  { value: ParcelReconciliationActionType.VOID_AND_REBOOK, label: 'Void and Rebook' },
  { value: ParcelReconciliationActionType.VOID_TO_SUSPENSE, label: 'Void to Suspense' },
  {
    value: ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE,
    label: 'Keep Original, Void Duplicate',
  },
  { value: ParcelReconciliationActionType.MERGE_TO_SINGLE, label: 'Merge to Single Record' },
] as const;

export const CASE_STATUS_LABEL: Record<number, string> = {
  0: 'Requested',
  1: 'Approved',
  2: 'Executed',
  3: 'Rejected',
};
