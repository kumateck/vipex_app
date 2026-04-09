import { ParcelStatus } from '@/db/schemas/enums';

export function formatCurrency(amountPsw: number) {
  return `GHS ${(amountPsw / 100).toFixed(2)}`;
}

export function formatPhones(primary?: string | null, secondary?: string | null) {
  const phones = [primary, secondary].filter((value): value is string => Boolean(value?.trim()));
  return phones.length ? phones.join(', ') : '-';
}

export function canReturnToPickup(status: number) {
  return (
    status === ParcelStatus.HOME_DELIVERY_REQUESTED ||
    status === ParcelStatus.ADDRESS_COLLECTED ||
    status === ParcelStatus.RETURNED_TO_OFFICE
  );
}
