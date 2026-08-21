export type ManagementDailyBriefScope = {
  companyId: string;
};

export type GenerateManagementDailyBriefInput = ManagementDailyBriefScope & {
  userId: string;
};

export type GetLatestManagementDailyBriefInput = {
  companyId: string;
};

export type SubBriefSummary = {
  available: boolean;
  isStale: boolean;
  asOf: string | null;
  succeeded: boolean | null;
  narrative: string | null;
};

export type DataCompleteness = {
  executiveInsights: boolean;
  fleetAnomalyBrief: boolean;
  operationsExceptionsBrief: boolean;
};

export type GroundingSnapshot = {
  generatedAt: string;
  staleAfterHours: number;
  executiveInsights: SubBriefSummary;
  fleetAnomalyBrief: SubBriefSummary;
  operationsExceptionsBrief: SubBriefSummary;
  dataCompleteness: DataCompleteness;
};

export type ManagementDailyBriefResult = {
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

export type LogManagementDailyBriefInput = {
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
