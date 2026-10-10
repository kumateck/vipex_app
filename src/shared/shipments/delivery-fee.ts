import { ParcelStatus } from '@/db/schemas/enums';
import { MAX_STANDARD_PARCEL_CHARGE_CEDIS } from './parcel-charge-policy';

export function canEditDeliveryFee(status: number) {
  return [
    ParcelStatus.HOME_DELIVERY_REQUESTED,
    ParcelStatus.ADDRESS_COLLECTED,
    ParcelStatus.DISPATCHED,
    ParcelStatus.RETURNED_TO_OFFICE,
    ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
  ].includes(status);
}

export function getDeliveryFeeInputError(value: string): string | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) {
    return 'Enter a non-negative delivery fee with at most two decimal places';
  }
  if (Number(value) > MAX_STANDARD_PARCEL_CHARGE_CEDIS) {
    return `Delivery fee cannot exceed GHS ${MAX_STANDARD_PARCEL_CHARGE_CEDIS.toLocaleString()}`;
  }
  return null;
}
