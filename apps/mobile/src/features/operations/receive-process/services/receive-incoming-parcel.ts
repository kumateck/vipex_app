import { mobileApiPost } from '@mobile/lib/api';
import { ParcelStatus } from '@mobile/constants/parcel-status';

export function receiveIncomingParcel(token: string, parcelId: string) {
  return mobileApiPost<{ id: string; receivedAt: string }>({
    path: `/shipments/parcels/${parcelId}/mark-received`,
    token,
    body: { status: ParcelStatus.ARRIVED_AT_DESTINATION },
  });
}
