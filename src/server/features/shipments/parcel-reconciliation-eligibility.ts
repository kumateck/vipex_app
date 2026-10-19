import { ParcelStatus } from '@/db/schemas/enums';

export function isParcelEligibleForReconciliation(status: number) {
  return (
    status !== ParcelStatus.DELIVERED_AT_HOME &&
    status !== ParcelStatus.DELIVERED_BY_OFFICE &&
    status !== ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER
  );
}
