export const STOCK_MOVEMENT_TYPE_OPTIONS = [
  { value: 0, label: 'Receipt' },
  { value: 1, label: 'Issue' },
  { value: 2, label: 'Adjustment' },
  { value: 3, label: 'Transfer Out' },
  { value: 4, label: 'Transfer In' },
] as const;

export const STOCK_ADJUSTMENT_REASON_OPTIONS = [
  { value: 0, label: 'Damage' },
  { value: 1, label: 'Loss' },
  { value: 2, label: 'Found' },
  { value: 3, label: 'Recount' },
  { value: 4, label: 'Expired' },
  { value: 5, label: 'Other' },
] as const;

export const STOCK_TRANSFER_STATUS_OPTIONS = [
  { value: 0, label: 'Pending' },
  { value: 1, label: 'In transit' },
  { value: 2, label: 'Completed' },
  { value: 3, label: 'Cancelled' },
] as const;

export const stockMovementTypeLabelByValue: ReadonlyMap<number, string> = new Map<number, string>(
  STOCK_MOVEMENT_TYPE_OPTIONS.map((item) => [item.value, item.label]),
);

export const stockAdjustmentReasonLabelByValue: ReadonlyMap<number, string> = new Map<number, string>(
  STOCK_ADJUSTMENT_REASON_OPTIONS.map((item) => [item.value, item.label]),
);

export const stockTransferStatusLabelByValue: ReadonlyMap<number, string> = new Map<number, string>(
  STOCK_TRANSFER_STATUS_OPTIONS.map((item) => [item.value, item.label]),
);
