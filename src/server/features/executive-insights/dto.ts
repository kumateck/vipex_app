export type ExecutiveInsightsScope = {
  companyId: string;
  branchId?: string | null;
  from: string;
  to: string;
};

export type GenerateExecutiveInsightsInput = ExecutiveInsightsScope & {
  userId: string;
};

export type GetLatestExecutiveInsightsInput = {
  companyId: string;
  branchId?: string | null;
};

export type BranchFigure = {
  branchName: string;
  incomeCedis: number;
  expenseCedis: number;
  netProfitCedis: number;
};

export type DataCompleteness = {
  income: boolean;
  cashFlow: boolean;
  branchProfitability: boolean;
  creditExposure: boolean;
  auditAnalytics: boolean;
};

export type GroundingSnapshot = {
  periodFrom: string;
  periodTo: string;
  branchId: string | null;
  totalIncomeCedis: number;
  totalExpenseCedis: number;
  netProfitCedis: number;
  netCashChangeCedis: number;
  operatingCashNetCedis: number;
  branches: BranchFigure[];
  creditOutstandingCedis: number;
  creditBucket1To30Cedis: number;
  creditBucket31To60Cedis: number;
  creditBucket61To90Cedis: number;
  creditBucket91PlusCedis: number;
  auditTotalEvents: number;
  auditSuspiciousActions: number;
  auditDeletedActions: number;
  auditSecuritySignals: number;
  dataCompleteness: DataCompleteness;
};

export type ExecutiveInsightsResult = {
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

export type LogExecutiveInsightInput = {
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
