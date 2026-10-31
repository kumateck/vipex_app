export type MaintenanceScriptId =
  | 'trace-credit-parcel'
  | 'repair-credit-print-payment'
  | 'scan-credit-conflicts'
  | 'check-parcel-booking-search'
  | 'inspect-cleared-delivery-fee'
  | 'backfill-parcel-customer-names'
  | 'restore-reversed-parcel-balance'
  | 'fix-reversed-booking-to-be-paid'
  | 'repair-parcel-financial-state'
  | 'repair-parcel-receiving-workflow';
export type MaintenanceParams = Record<string, string | boolean>;
export type MaintenanceField = {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  required: boolean;
};
export type MaintenanceScript = {
  id: MaintenanceScriptId;
  title: string;
  description: string;
  kind: 'inspection' | 'repair';
  fields: MaintenanceField[];
  confirmation?: string;
  sourceFiles?: string[];
};
export type MaintenanceResult = {
  summary: string;
  details: Record<string, unknown>;
  readyToApply: boolean;
};
export type MaintenanceRun = {
  id: string;
  operationId: MaintenanceScriptId;
  mode: 'preview' | 'execute';
  status: 'running' | 'succeeded' | 'failed';
  params: MaintenanceParams;
  createdAt: string;
  completedAt?: string;
  actorName?: string;
  result?: MaintenanceResult;
  error?: string;
};
export type MaintenanceRunRequest = {
  operationId: MaintenanceScriptId;
  params: MaintenanceParams;
  mode: 'preview' | 'execute';
  previewRunId?: string;
  confirmNoCashReceived?: boolean;
  confirmRepair?: boolean;
};
