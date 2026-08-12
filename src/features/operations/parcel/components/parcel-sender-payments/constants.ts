import {
  ParcelReconciliationActionType,
  ParcelReconciliationCaseType,
  PaymentMethod,
} from '@/db/schemas/enums';
import type { PaginationMeta, SortField } from '@/server/types/pagination.types';

export const SENDER_PAYMENTS_DEFAULT_SORT: SortField[] = [
  { field: 'createdAt', direction: 'desc' },
];

export const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

export const PAYMENT_METHOD_OPTIONS = [
  { value: PaymentMethod.CASH, label: 'Cash' },
  { value: PaymentMethod.MTN, label: 'MTN' },
  { value: PaymentMethod.TELECEL, label: 'Telecel' },
  { value: PaymentMethod.AIRTEL, label: 'Airtel' },
];

export const PAYMENT_TYPE_LEGEND = [
  { label: 'Sender Pay', dotClassName: 'bg-emerald-500' },
  { label: 'Receiver Pay', dotClassName: 'bg-amber-500' },
  { label: 'Partial Pay', dotClassName: 'bg-sky-500' },
];

export const RECON_CASE_TYPE_OPTIONS = [
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
];

export const RECON_ACTION_OPTIONS = [
  { value: ParcelReconciliationActionType.VOID_AND_REFUND, label: 'Void and Refund' },
  { value: ParcelReconciliationActionType.VOID_AND_REBOOK, label: 'Void and Rebook' },
  { value: ParcelReconciliationActionType.VOID_TO_SUSPENSE, label: 'Void to Suspense' },
  {
    value: ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE,
    label: 'Keep Original, Void Duplicate',
  },
  { value: ParcelReconciliationActionType.MERGE_TO_SINGLE, label: 'Merge to Single Record' },
];
