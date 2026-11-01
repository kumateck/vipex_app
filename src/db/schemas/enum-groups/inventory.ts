export enum StockMovementType {
  RECEIPT = 0,
  ISSUE = 1,
  ADJUSTMENT = 2,
  TRANSFER_OUT = 3,
  TRANSFER_IN = 4,
}

export enum StockAdjustmentReason {
  DAMAGE = 0,
  LOSS = 1,
  FOUND = 2,
  RECOUNT = 3,
  EXPIRED = 4,
  OTHER = 5,
}

export enum TransferStatus {
  PENDING = 0,
  IN_TRANSIT = 1,
  COMPLETED = 2,
  CANCELLED = 3,
  PARTIALLY_FULFILLED = 4,
}

export enum StockRequestStatus {
  DRAFT = 0,
  SUBMITTED = 1,
  APPROVED = 2,
  PARTIALLY_FULFILLED = 3,
  FULFILLED = 4,
  REJECTED = 5,
  CANCELLED = 6,
}

export enum StockRequestType {
  INTER_BRANCH = 0,
  INTRA_BRANCH = 1,
}

export enum InventoryMaintenanceIssueType {
  MAINTENANCE = 0,
  DAMAGE = 1,
  MISSING = 2,
}

export enum InventoryMaintenanceStatus {
  OPEN = 0,
  CLOSED = 1,
}

export enum InventoryLocationType {
  MAIN_STORE = 0,
  BRANCH_STORE = 1,
  CONSUMPTION_LOCATION = 2,
}

export enum StockAllocationStrategy {
  FEFO = 0,
  OLDEST_RECEIPT = 1,
  HIGHEST_AVAILABLE = 2,
}

export enum StockReservationStatus {
  OPEN = 0,
  PARTIALLY_ALLOCATED = 1,
  ALLOCATED = 2,
  ISSUED = 3,
  SHORT = 4,
  CANCELLED = 5,
}

export enum StockReservationAllocationStatus {
  RESERVED = 0,
  RELEASED = 1,
  ISSUED = 2,
}

export enum StockLotStatus {
  ACTIVE = 0,
  EXPIRED = 1,
  QUARANTINED = 2,
  DEPLETED = 3,
}

export enum StockCountSessionStatus {
  DRAFT = 0,
  SUBMITTED = 1,
  APPROVED = 2,
  CANCELLED = 3,
}

export enum UnitOfMeasure {
  PIECE = 0,
  BOX = 1,
  CARTON = 2,
  KG = 3,
  LITER = 4,
  METER = 5,
  PACK = 6,
  DOZEN = 7,
}

export enum InventoryApprovalEntityType {
  STOCK_REQUEST = 0,
  STOCK_TRANSFER = 1,
  STOCK_ADJUSTMENT = 2,
  REPLENISHMENT_PROPOSAL = 3,
}

export enum InventoryApprovalStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
  ESCALATED = 3,
  CANCELLED = 4,
}

export enum InventoryValuationMethod {
  WEIGHTED_AVERAGE = 0,
  FIFO = 1,
}

export enum InventoryReplenishmentProposalStatus {
  DRAFT = 0,
  SUBMITTED = 1,
  APPROVED = 2,
  REJECTED = 3,
  CANCELLED = 4,
}

export enum InventoryTaskType {
  PICK = 0,
  PACK = 1,
  DISPATCH = 2,
  CYCLE_COUNT = 3,
}

export enum InventoryTaskStatus {
  OPEN = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  CANCELLED = 3,
}

export enum InventoryEventType {
  POLICY_UPDATED = 0,
  APPROVAL_SUBMITTED = 1,
  APPROVAL_DECIDED = 2,
  VALUATION_RECOMPUTED = 3,
  REPLENISHMENT_GENERATED = 4,
  REPLENISHMENT_DECIDED = 5,
  TASK_CREATED = 6,
  TASK_SCANNED = 7,
  CORRECTION_POSTED = 8,
}
