import type { ParcelAnalyticsQuery } from '@/shared/reporting';

export type AnalyticsScope = ParcelAnalyticsQuery & { companyId: string; lockedBranchId?: string };
export type AnalyticsGroup = {
  branchId: string;
  day: string;
  status: number;
  parcels: number;
  chargePsw: number;
  receiverOutstandingPsw: number;
  ageDaysSum: number;
  receiptHoursSum: number;
  receiptSamples: number;
  uncollected7Days: number;
  age0To3: number;
  age4To7: number;
  age8To14: number;
  age15Plus: number;
};
