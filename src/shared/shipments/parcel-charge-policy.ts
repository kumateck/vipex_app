import { isChargeExemptCustomerType } from '@/shared/customers/customer-types';

export const MAX_STANDARD_PARCEL_CHARGE_CEDIS = 100_000;

type ParcelChargeAmounts = {
  chargeExemptCustomerType?: number | null;
  chargeCedis: number;
  plannedToBePaidCedis: number;
};

export function getParcelChargeValidationError({
  chargeExemptCustomerType,
  chargeCedis,
  plannedToBePaidCedis,
}: ParcelChargeAmounts): string | null {
  if (isChargeExemptCustomerType(chargeExemptCustomerType)) {
    return chargeCedis === 0 && plannedToBePaidCedis === 0
      ? null
      : 'Exempt parcels cannot have any charge or receiver balance';
  }
  if (!Number.isFinite(chargeCedis) || chargeCedis < 0.01) {
    return 'Parcel charge must be at least GHS 0.01';
  }
  if (!Number.isFinite(plannedToBePaidCedis) || plannedToBePaidCedis < 0) {
    return 'Enter a valid receiver to-be-paid amount';
  }
  if (chargeCedis > MAX_STANDARD_PARCEL_CHARGE_CEDIS) {
    return `Parcel charge cannot exceed GH₵${MAX_STANDARD_PARCEL_CHARGE_CEDIS.toLocaleString()}. Check that a telephone number was not entered by mistake.`;
  }
  if (plannedToBePaidCedis > chargeCedis) {
    return 'Receiver to-be-paid amount cannot exceed the total parcel charge';
  }
  return null;
}
