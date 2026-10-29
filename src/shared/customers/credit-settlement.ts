export type CreditParcel = {
  parcelId: string;
  bookingCode: string;
  trackingCode: string;
  createdAt: string;
  chargeAmountPsw: number;
  allocatedAmountPsw: number;
  outstandingAmountPsw: number;
};

export type CreditSettlementInput = {
  parcelIds: string[];
  amountCedis: number | string;
  referenceId?: string | null;
  notes?: string | null;
};

/** Reject fractional pesewas, rounding to zero and unsafe integer totals. */
export function parsePositiveCedis(value: string | number): number | null {
  const text = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const amount = Math.round(Number(text) * 100);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}
