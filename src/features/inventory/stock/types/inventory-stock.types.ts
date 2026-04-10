import type { ServerListQuery } from '@/services/rtk-query/types';

export interface StockLevel {
  id: string;
  companyId: string;
  productId: string;
  locationId: string;
  quantity: string;
  updatedAt?: string;
}

export type StockLevelFilters = {
  companyId?: string | null;
  productId?: string | null;
  locationId?: string | null;
};

export type StockLevelListQuery = ServerListQuery<StockLevelFilters>;

export interface StockMovement {
  id: string;
  companyId: string;
  productId: string;
  locationId: string;
  movementType: number;
  quantity: string;
  referenceId?: string | null;
  referenceType?: string | null;
  notes?: string | null;
  createdBy: string;
  createdAt?: string;
}

export type StockMovementFilters = {
  companyId?: string | null;
  productId?: string | null;
  locationId?: string | null;
  movementType?: number | null;
};

export type StockMovementListQuery = ServerListQuery<StockMovementFilters>;

export interface StockMovementCreateInput {
  productId: string;
  locationId: string;
  movementType: number;
  quantity: string;
  batchNumber?: string;
  sourceLotId?: string;
  supplierBatchNumber?: string;
  expiryDate?: string;
  manufacturedAt?: string;
  receivedAt?: string;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
}

export interface StockMovementCreatePayload extends StockMovementCreateInput {
  companyId: string;
  createdBy: string;
}

export interface StockAdjustment {
  id: string;
  companyId: string;
  productId: string;
  locationId: string;
  reason: number;
  quantityChange: string;
  notes?: string | null;
  createdBy: string;
  createdAt?: string;
}

export type StockAdjustmentFilters = {
  companyId?: string | null;
  productId?: string | null;
  locationId?: string | null;
};

export type StockAdjustmentListQuery = ServerListQuery<StockAdjustmentFilters>;

export interface StockAdjustmentCreateInput {
  productId: string;
  locationId: string;
  reason: number;
  quantityChange: string;
  batchNumber?: string;
  sourceLotId?: string;
  supplierBatchNumber?: string;
  expiryDate?: string;
  manufacturedAt?: string;
  notes?: string;
}

export interface StockAdjustmentCreatePayload extends StockAdjustmentCreateInput {
  companyId: string;
  createdBy: string;
}

export interface StockTransfer {
  id: string;
  companyId: string;
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: string;
  fulfilledQuantity: string;
  status: number;
  notes?: string | null;
  createdBy: string;
  createdAt?: string;
  completedBy?: string | null;
  completedAt?: string | null;
  updatedAt?: string;
  acceptance?: {
    totalAccepted: string;
    totalDamaged: string;
    totalMissing: string;
    netReceived: string;
    pendingToAcknowledge: string;
    rows: StockTransferAcceptance[];
  };
}

export type StockTransferFilters = {
  companyId?: string | null;
  productId?: string | null;
  status?: number | null;
};

export type StockTransferListQuery = ServerListQuery<StockTransferFilters>;

export interface StockTransferCreateInput {
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: string;
  notes?: string;
}

export interface StockTransferCreatePayload extends StockTransferCreateInput {
  companyId: string;
  createdBy: string;
}

export interface StockTransferUpdateInput {
  status?: number;
  fulfillQuantity?: string;
}

export interface StockTransferUpdatePayload extends StockTransferUpdateInput {
  completedBy?: string;
}

export interface StockTransferAcknowledgeReceiptInput {
  acceptedQuantity: string;
  damagedQuantity?: string;
  missingQuantity?: string;
  notes?: string;
}

export interface StockTransferAcceptance {
  id: string;
  transferId: string;
  acceptedQuantity: string;
  damagedQuantity: string;
  missingQuantity: string;
  notes?: string | null;
  acknowledgedBy: string;
  acknowledgedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockRequestLine {
  id: string;
  requestId: string;
  productId: string;
  requestedQuantity: string;
  fulfilledQuantity: string;
  acknowledgedQuantity?: string;
  pendingAcknowledgementQuantity?: string;
  acknowledgements?: StockRequestLineAcknowledgement[];
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockRequestLineAcknowledgement {
  id: string;
  requestId: string;
  requestLineId: string;
  acknowledgedQuantity: string;
  notes?: string | null;
  acknowledgedBy: string;
  acknowledgedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockRequest {
  id: string;
  companyId: string;
  requesterLocationId: string;
  requestedToLocationId?: string | null;
  status: number;
  notes?: string | null;
  requestedBy: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lines?: StockRequestLine[];
}

export type StockRequestFilters = {
  companyId?: string | null;
  requesterLocationId?: string | null;
  status?: number | null;
};

export type StockRequestListQuery = ServerListQuery<StockRequestFilters>;

export interface StockRequestCreateLineInput {
  productId: string;
  requestedQuantity: string;
  notes?: string;
}

export interface StockRequestCreateInput {
  requesterLocationId: string;
  requestedToLocationId?: string;
  notes?: string;
  submit?: boolean;
  lines: StockRequestCreateLineInput[];
}

export interface StockRequestCreatePayload {
  companyId: string;
  requesterLocationId: string;
  requestedToLocationId?: string;
  notes?: string;
  requestedBy: string;
  submit?: boolean;
  lines: {
    productId: string;
    requestedQuantity: string;
    notes?: string;
  }[];
}

export interface StockRequestRejectInput {
  reason?: string;
}

export interface StockRequestRejectPayload {
  rejectedBy: string;
  reason?: string;
}

export interface StockRequestFulfillLineInput {
  lineId: string;
  fromLocationId: string;
  fulfillQuantity: string;
  notes?: string;
}

export interface StockRequestLineAcknowledgeInput {
  lineId: string;
  acknowledgedQuantity: string;
  notes?: string;
}

export interface StockRequestFulfillLinePayload {
  lineId: string;
  fromLocationId: string;
  fulfillQuantity: string;
  fulfilledBy: string;
  notes?: string;
}

export interface InventoryDashboardSummary {
  totals: {
    totalLocations: number;
    totalSkus: number;
    totalQuantity: string;
    lowStockCount: number;
    outOfStockCount: number;
    openMaintenanceQty: string;
    missingQty: string;
  };
  lowStockItems: {
    productId: string;
    productName: string;
    productSku: string;
    minStockLevel: string;
    isRecoverable: boolean;
    quantity: string;
  }[];
  openMaintenanceItems: {
    id: string;
    productId: string;
    productName: string;
    locationId: string;
    locationName: string;
    issueType: number;
    quantity: string;
    quantityReturned: string;
    quantityDisposed: string;
    createdAt?: string;
  }[];
  scopeLocationIds: string[];
}

export interface StockRequestAllocationCandidate {
  locationId: string;
  availableQuantity: number;
  locationType: number;
  parentLocationId?: string | null;
}

export interface StockRequestAllocation {
  requestId: string;
  lineId: string;
  productId: string;
  requestedQuantity: number;
  fulfilledQuantity: number;
  remainingQuantity: number;
  candidates: StockRequestAllocationCandidate[];
}

export interface StockMaintenanceRecord {
  id: string;
  companyId: string;
  productId: string;
  locationId: string;
  issueType: number;
  status: number;
  quantity: string;
  quantityReturned: string;
  quantityDisposed: string;
  notes?: string | null;
  createdBy: string;
  createdAt?: string;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  updatedAt?: string;
}

export type StockMaintenanceFilters = {
  companyId?: string | null;
  locationId?: string | null;
  issueType?: number | null;
  status?: number | null;
};

export type StockMaintenanceListQuery = ServerListQuery<StockMaintenanceFilters>;

export interface StockMaintenanceCreateInput {
  productId: string;
  locationId: string;
  issueType: number;
  quantity: string;
  notes?: string;
}

export interface StockMaintenanceCreatePayload extends StockMaintenanceCreateInput {
  companyId: string;
  createdBy: string;
}

export interface StockMaintenanceResolveInput {
  quantityReturned?: string;
  quantityDisposed?: string;
  notes?: string;
}

export interface StockMaintenanceResolvePayload extends StockMaintenanceResolveInput {
  resolvedBy: string;
}

export interface StockAllocationPolicy {
  id: string;
  companyId: string;
  requesterRootLocationId?: string | null;
  strategy: number;
  allowPartial: boolean;
  prioritizeSameBranch: boolean;
  maxSourceLocations: number;
  active: boolean;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockAllocationPolicyUpsertInput {
  requesterRootLocationId?: string | null;
  strategy: number;
  allowPartial?: boolean;
  prioritizeSameBranch?: boolean;
  maxSourceLocations?: number;
  active?: boolean;
}

export interface StockReservationAllocation {
  id: string;
  reservationId: string;
  sourceLocationId: string;
  sourceLotId?: string | null;
  sequenceNo: number;
  reservedQuantity: string;
  issuedQuantity: string;
  status: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockReservation {
  id: string;
  companyId: string;
  requestId: string;
  requestLineId: string;
  productId: string;
  requesterLocationId: string;
  status: number;
  requestedQuantity: string;
  reservedQuantity: string;
  issuedQuantity: string;
  shortQuantity: string;
  notes?: string | null;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
  allocations?: StockReservationAllocation[];
}

export type StockReservationFilters = {
  companyId: string;
  status?: number | null;
  requestId?: string | null;
  productId?: string | null;
};

export type StockReservationListQuery = ServerListQuery<StockReservationFilters>;

export interface StockReservationExceptionsSummary {
  openCount: number;
  shortCount: number;
  shortQty: number;
  pendingQty: number;
}

export interface StockLot {
  id: string;
  companyId: string;
  productId: string;
  locationId: string;
  batchNumber: string;
  supplierBatchNumber?: string | null;
  receivedAt?: string;
  manufacturedAt?: string | null;
  expiryDate?: string | null;
  quantityOnHand: string;
  reservedQuantity: string;
  status: number;
  notes?: string | null;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
  movements?: StockLotMovement[];
}

export interface StockLotMovement {
  id: string;
  companyId: string;
  lotId: string;
  productId: string;
  locationId: string;
  movementType: number;
  quantity: string;
  referenceId?: string | null;
  referenceType?: string | null;
  notes?: string | null;
  createdBy: string;
  createdAt?: string;
}

export type StockLotFilters = {
  companyId: string;
  productId?: string | null;
  locationId?: string | null;
  status?: number | null;
  batchNumber?: string | null;
};

export type StockLotListQuery = ServerListQuery<StockLotFilters>;

export interface StockLotCreateInput {
  productId: string;
  locationId: string;
  batchNumber: string;
  quantityOnHand: string;
  supplierBatchNumber?: string;
  expiryDate?: string;
  manufacturedAt?: string;
  receivedAt?: string;
  notes?: string;
}

export interface StockLotExpiryAlertRow {
  id: string;
  productId: string;
  locationId: string;
  batchNumber: string;
  expiryDate?: string | null;
  quantityOnHand: string;
  reservedQuantity: string;
  status: number;
}

export interface StockLotExpiryAlerts {
  daysAhead: number;
  cutoff: string;
  totals: {
    nearExpiryCount: number;
    expiredCount: number;
    atRiskQuantity: string;
  };
  rows: StockLotExpiryAlertRow[];
}

export interface StockLotTraceability {
  lot: StockLot;
  movements: StockLotMovement[];
  procurementLinks: {
    goodsReceiptItemId: string;
    receivedQuantity: string;
    goodsReceiptId: string;
    receiptNo: string;
    receivedAt?: string | null;
    purchaseOrderId?: string | null;
    poNo?: string | null;
    supplierId?: string | null;
    supplierName?: string | null;
  }[];
}

export interface StockLotAnalytics {
  daysAhead: number;
  issueLookbackDays: number;
  generatedAt: string;
  totals: {
    totalLots: number;
    totalOnHand: string;
    totalReserved: string;
    expiredLots: number;
    nearExpiryLots: number;
    atRiskQuantity: string;
  };
  agingBuckets: {
    bucket: string;
    lotCount: number;
    quantity: number;
  }[];
  fefoCompliance: {
    evaluatedIssues: number;
    compliantIssues: number;
    nonCompliantIssues: number;
    complianceRatePct: number;
    items: {
      movementId: string;
      lotId: string;
      productId: string;
      locationId: string;
      issuedQuantity: string;
      issuedAt?: string | null;
      issuedLotBatchNumber: string;
      issuedLotExpiryDate?: string | null;
      expectedEarliestExpiryDate?: string | null;
    }[];
  };
}

export interface StockCountSessionLine {
  id: string;
  sessionId: string;
  productId: string;
  systemQuantity: string;
  countedQuantity: string;
  varianceQuantity: string;
  varianceReason?: string | null;
  adjustmentMovementId?: string | null;
  countedBy?: string | null;
  countedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockCountSession {
  id: string;
  companyId: string;
  locationId: string;
  sessionNo: string;
  status: number;
  notes?: string | null;
  submittedBy?: string | null;
  submittedAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
  lines?: StockCountSessionLine[];
}

export type StockCountSessionFilters = {
  companyId: string;
  locationId?: string | null;
  status?: number | null;
};

export type StockCountSessionListQuery = ServerListQuery<StockCountSessionFilters>;

export interface StockCountSessionCreateInput {
  locationId: string;
  notes?: string;
  productIds?: string[];
}

export interface InventoryMonitoringSummary {
  generatedAt: string;
  reservationExceptions: {
    openCount: number;
    shortCount: number;
    shortQty: string;
    pendingQty: string;
  };
  lotRisk: {
    nearExpiryCount: number;
    expiredCount: number;
    atRiskQuantity: string;
    fefoComplianceRatePct: number;
    fefoNonCompliantIssues: number;
  };
  stockCountSessions: {
    draft: number;
    submitted: number;
    approved: number;
  };
}

export interface ReorderSuggestion {
  productId: string;
  productName: string;
  productSku: string;
  locationId: string;
  locationName: string;
  locationType: number;
  currentQuantity: string;
  minStockLevel: string;
  reorderQuantity: string;
  suggestedSources: {
    locationId: string;
    locationName: string;
    locationType: number;
    availableQuantity: string;
  }[];
}

export interface ReorderSuggestionsResponse {
  generatedAt: string;
  companyId: string;
  locationId?: string | null;
  totalRows: number;
  rows: ReorderSuggestion[];
}

export interface InventoryApprovalPolicy {
  id: string;
  companyId: string;
  entityType: number;
  minAmount: number;
  maxAmount?: number | null;
  locationType?: number | null;
  level1ApproverRoleId?: string | null;
  level2ApproverRoleId?: string | null;
  slaHours: number;
  escalationRoleId?: string | null;
  active: boolean;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryApprovalPolicyCreateInput {
  entityType: number;
  minAmount?: number;
  maxAmount?: number | null;
  locationType?: number | null;
  level1ApproverRoleId?: string | null;
  level2ApproverRoleId?: string | null;
  slaHours?: number;
  escalationRoleId?: string | null;
  active?: boolean;
}

export interface InventoryApprovalRequest {
  id: string;
  companyId: string;
  entityType: number;
  entityId: string;
  policyId?: string | null;
  status: number;
  levelNo: number;
  amount: number;
  submittedBy: string;
  submittedAt?: string;
  dueAt?: string | null;
  decidedBy?: string | null;
  decidedAt?: string | null;
  decisionReason?: string | null;
  escalationAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryApprovalRequestCreateInput {
  entityType: number;
  entityId: string;
  amount: number;
}

export interface InventoryApprovalDecisionInput {
  status: number;
  reason?: string;
}

export interface InventoryValuationSummary {
  generatedAt: string;
  method: number;
  totals: {
    totalQuantity: string;
    totalValue: string;
  };
  rows: {
    productId: string;
    locationId: string;
    quantity: string;
    averageUnitCost: string;
    totalValue: string;
  }[];
}

export interface ReplenishmentProposal {
  id: string;
  companyId: string;
  proposalNo: string;
  scopeLocationId?: string | null;
  leadTimeDays: number;
  coverageDays: number;
  status: number;
  notes?: string | null;
  generatedBy: string;
  generatedAt?: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReplenishmentProposalDetail extends ReplenishmentProposal {
  lines: {
    id: string;
    proposalId: string;
    productId: string;
    locationId: string;
    sourceLocationId?: string | null;
    currentQuantity: string;
    minStockLevel: string;
    suggestedQuantity: string;
    approvedQuantity?: string | null;
    createdAt?: string;
    updatedAt?: string;
  }[];
}

export interface ReplenishmentProposalCreateInput {
  scopeLocationId?: string | null;
  leadTimeDays?: number;
  coverageDays?: number;
  notes?: string;
}

export interface InventoryTask {
  id: string;
  companyId: string;
  taskType: number;
  status: number;
  productId?: string | null;
  fromLocationId?: string | null;
  toLocationId?: string | null;
  plannedQuantity: string;
  processedQuantity: string;
  assignedTo?: string | null;
  dueAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryTaskDetail extends InventoryTask {
  scans: {
    id: string;
    taskId: string;
    scanCode: string;
    quantity: string;
    scannedBy: string;
    scannedAt?: string;
    createdAt?: string;
    updatedAt?: string;
  }[];
}

export interface InventoryTaskCreateInput {
  taskType: number;
  productId?: string | null;
  fromLocationId?: string | null;
  toLocationId?: string | null;
  plannedQuantity?: string;
  assignedTo?: string | null;
  notes?: string;
}

export interface InventoryTaskScanInput {
  scanCode: string;
  quantity: string;
}

export interface InventoryEventJournalRow {
  id: string;
  companyId: string;
  eventType: number;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown> | null;
  createdBy: string;
  createdAt?: string;
}

export interface InventoryCorrectionInput {
  productId: string;
  locationId: string;
  quantityChange: string;
  notes?: string;
}

export interface InventoryEnterpriseKpis {
  generatedAt: string;
  windowDays: number;
  movements: {
    count: number;
    issueQuantity: string;
    receiptQuantity: string;
  };
  serviceLevel: {
    requestLines: number;
    requestedQuantity: string;
    fulfilledQuantity: string;
    fillRatePct: number;
  };
  aging: {
    nearExpiryLots: number;
    expiredLots: number;
    atRiskQuantity: string;
  };
}
