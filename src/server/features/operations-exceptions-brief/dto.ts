export type OperationsExceptionsBriefScope = {
  companyId: string;
  branchId?: string | null;
  from: string;
  to: string;
};

export type GenerateOperationsExceptionsBriefInput = OperationsExceptionsBriefScope & {
  userId: string;
};

export type GetLatestOperationsExceptionsBriefInput = {
  companyId: string;
  branchId?: string | null;
};

export type TypeCountFigure = {
  type: string;
  count: number;
};

export type DataCompleteness = {
  openDiscrepancies: boolean;
  reconciliationCases: boolean;
  agedParcels: boolean;
  misroutedScans: boolean;
  stuckParcels: boolean;
};

export type GroundingSnapshot = {
  periodFrom: string;
  periodTo: string;
  branchId: string | null;
  // Discrepancies/reconciliation-cases/aged/stuck counts are current
  // point-in-time backlog snapshots (open now), not bounded to the period —
  // only the misrouted-scan count is period-bound (from the audit log).
  openDiscrepancyCount: number | null;
  openDiscrepancyTypeBreakdown: TypeCountFigure[];
  openReconciliationCaseCount: number | null;
  reconciliationCaseTypeBreakdown: TypeCountFigure[];
  agedParcelCount: number | null;
  storageChargeAccruingCount: number | null;
  misroutedScanCount: number | null;
  stuckParcelCount: number | null;
  stuckAfterDays: number;
  dataCompleteness: DataCompleteness;
};

export type OperationsExceptionsBriefResult = {
  id: string;
  periodFrom: string;
  periodTo: string;
  branchId: string | null;
  narrative: string | null;
  provider: string | null;
  succeeded: boolean;
  grounding: GroundingSnapshot | null;
  generatedByUserId: string;
  createdAt: string;
};

export type LogOperationsExceptionsBriefInput = {
  companyId: string;
  generatedByUserId: string;
  branchId: string | null;
  periodFrom: string;
  periodTo: string;
  groundingSnapshot: GroundingSnapshot;
  narrative: string | null;
  provider: string | null;
  succeeded: boolean;
  errorReason?: string | null;
};
