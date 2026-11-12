import type { CreditParcel } from './credit-settlement';

export type OutstandingDebtParcel = CreditParcel & {
  parcelDetails: string;
  parcelContent: string;
};

export type OutstandingDebtStatement = {
  generatedAt: string;
  parcels: OutstandingDebtParcel[];
  summary: {
    parcelCount: number;
    oldestParcelCreatedAt: string | null;
    parcelOutstandingPsw: number;
    otherCreditActivityPsw: number;
    accountBalancePsw: number;
  };
};
