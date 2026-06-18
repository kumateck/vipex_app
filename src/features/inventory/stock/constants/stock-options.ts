import {
  InventoryMaintenanceIssueType,
  InventoryMaintenanceStatus,
  StockRequestType,
  StockAdjustmentReason,
  StockMovementType,
  StockRequestStatus,
  TransferStatus,
} from '@/db/schemas/enums';

export const STOCK_MOVEMENT_TYPE_OPTIONS = [
  { value: StockMovementType.RECEIPT, label: 'Receipt' },
  { value: StockMovementType.ISSUE, label: 'Issue' },
  { value: StockMovementType.ADJUSTMENT, label: 'Adjustment' },
  { value: StockMovementType.TRANSFER_OUT, label: 'Transfer Out' },
  { value: StockMovementType.TRANSFER_IN, label: 'Transfer In' },
] as const;

export const STOCK_ADJUSTMENT_REASON_OPTIONS = [
  { value: StockAdjustmentReason.DAMAGE, label: 'Damage' },
  { value: StockAdjustmentReason.LOSS, label: 'Loss' },
  { value: StockAdjustmentReason.FOUND, label: 'Found' },
  { value: StockAdjustmentReason.RECOUNT, label: 'Recount' },
  { value: StockAdjustmentReason.EXPIRED, label: 'Expired' },
  { value: StockAdjustmentReason.OTHER, label: 'Other' },
] as const;

export const STOCK_TRANSFER_STATUS_OPTIONS = [
  { value: TransferStatus.PENDING, label: 'Pending' },
  { value: TransferStatus.IN_TRANSIT, label: 'In transit' },
  { value: TransferStatus.PARTIALLY_FULFILLED, label: 'Partially fulfilled' },
  { value: TransferStatus.COMPLETED, label: 'Completed' },
  { value: TransferStatus.CANCELLED, label: 'Cancelled' },
] as const;

export const stockMovementTypeLabelByValue: ReadonlyMap<number, string> = new Map<number, string>(
  STOCK_MOVEMENT_TYPE_OPTIONS.map((item) => [item.value, item.label]),
);

export const stockAdjustmentReasonLabelByValue: ReadonlyMap<number, string> = new Map<
  number,
  string
>(STOCK_ADJUSTMENT_REASON_OPTIONS.map((item) => [item.value, item.label]));

export const stockTransferStatusLabelByValue: ReadonlyMap<number, string> = new Map<number, string>(
  STOCK_TRANSFER_STATUS_OPTIONS.map((item) => [item.value, item.label]),
);

export const STOCK_REQUEST_STATUS_OPTIONS = [
  { value: StockRequestStatus.DRAFT, label: 'Draft' },
  { value: StockRequestStatus.SUBMITTED, label: 'Submitted' },
  { value: StockRequestStatus.APPROVED, label: 'Approved' },
  { value: StockRequestStatus.PARTIALLY_FULFILLED, label: 'Partially fulfilled' },
  { value: StockRequestStatus.FULFILLED, label: 'Fulfilled' },
  { value: StockRequestStatus.REJECTED, label: 'Rejected' },
  { value: StockRequestStatus.CANCELLED, label: 'Cancelled' },
] as const;

export const stockRequestStatusLabelByValue: ReadonlyMap<number, string> = new Map<number, string>(
  STOCK_REQUEST_STATUS_OPTIONS.map((item) => [item.value, item.label]),
);

export const STOCK_REQUEST_TYPE_OPTIONS = [
  { value: StockRequestType.INTER_BRANCH, label: 'Inter branch' },
  { value: StockRequestType.INTRA_BRANCH, label: 'Intra branch' },
] as const;

export const stockRequestTypeLabelByValue: ReadonlyMap<number, string> = new Map<number, string>(
  STOCK_REQUEST_TYPE_OPTIONS.map((item) => [item.value, item.label]),
);

export const STOCK_MAINTENANCE_ISSUE_TYPE_OPTIONS = [
  { value: InventoryMaintenanceIssueType.MAINTENANCE, label: 'Maintenance' },
  { value: InventoryMaintenanceIssueType.DAMAGE, label: 'Damage' },
  { value: InventoryMaintenanceIssueType.MISSING, label: 'Missing' },
] as const;

export const STOCK_MAINTENANCE_STATUS_OPTIONS = [
  { value: InventoryMaintenanceStatus.OPEN, label: 'Open' },
  { value: InventoryMaintenanceStatus.CLOSED, label: 'Closed' },
] as const;

export const stockMaintenanceIssueTypeLabelByValue: ReadonlyMap<number, string> = new Map<
  number,
  string
>(STOCK_MAINTENANCE_ISSUE_TYPE_OPTIONS.map((item) => [item.value, item.label]));

export const stockMaintenanceStatusLabelByValue: ReadonlyMap<number, string> = new Map<
  number,
  string
>(STOCK_MAINTENANCE_STATUS_OPTIONS.map((item) => [item.value, item.label]));
