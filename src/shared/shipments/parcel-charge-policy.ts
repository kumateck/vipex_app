export const MAX_STANDARD_PARCEL_CHARGE_CEDIS = 100_000;

type ParcelChargeAmounts = {
  chargeCedis: number;
  plannedToBePaidCedis: number;
};

export function getParcelChargeValidationError({
  chargeCedis,
  plannedToBePaidCedis,
}: ParcelChargeAmounts): string | null {
  if (!Number.isFinite(chargeCedis) || chargeCedis < 0) {
    return 'Enter a valid parcel charge';
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
