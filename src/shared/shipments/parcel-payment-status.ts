export type ParcelPaymentStatus = 'PAID' | 'TO_BE_PAID' | 'CREDIT' | 'PARTIAL' | 'CHARGE_MISSING';
export const PARCEL_PAYMENT_STATUS_LABEL: Record<ParcelPaymentStatus, string> = {
  PAID: 'Paid',
  TO_BE_PAID: 'To Be Paid',
  CREDIT: 'Credit',
  PARTIAL: 'Partial',
  CHARGE_MISSING: 'Charge missing',
};
export function getParcelPaymentStatus(input: {
  chargePsw: number;
  method: number;
  paidPrincipalPsw: number;
  creditPaidPsw: number;
}): ParcelPaymentStatus {
  if (input.method === 4)
    return input.chargePsw > 0 && input.creditPaidPsw >= input.chargePsw ? 'PAID' : 'CREDIT';
  if (input.chargePsw <= 0) return 'CHARGE_MISSING';
  if (input.paidPrincipalPsw >= input.chargePsw) return 'PAID';
  return input.paidPrincipalPsw > 0 ? 'PARTIAL' : 'TO_BE_PAID';
}
