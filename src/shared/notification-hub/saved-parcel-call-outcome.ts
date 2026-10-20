import { ParcelStatus } from '@/db/schemas/enums';

export type SavedParcelCallOutcome = 'pickup' | 'delivery' | 'follow_up';

export function getSavedParcelCallOutcome(parcel: {
  status: number;
  callCenterCalledAt?: string | Date | null;
}): SavedParcelCallOutcome | null {
  if (!parcel.callCenterCalledAt) return null;
  if (parcel.status === ParcelStatus.AWAITING_PICKUP) return 'pickup';
  if (parcel.status === ParcelStatus.HOME_DELIVERY_REQUESTED) return 'delivery';
  if (parcel.status === ParcelStatus.CUSTOMER_CONTACTED) return 'follow_up';
  return null;
}
