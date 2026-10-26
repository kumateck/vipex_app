export const REPAIR_MARKER = 'CREDIT_PRINT_PHANTOM_PAYMENT_REPAIR';
export type RepairOptions = {
  code: string;
  companyId?: string;
  paymentId?: string;
  expectedPsw?: number;
  actorId: string | null;
  reason: string;
  apply: boolean;
  executionSource?: 'maintenance-cli' | 'maintenance-ui';
};
