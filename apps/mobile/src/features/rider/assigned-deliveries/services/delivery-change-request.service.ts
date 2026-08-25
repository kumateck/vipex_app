import { mobileApiGet, mobileApiPost } from '@mobile/lib/api';
import type {
  RiderDeliveryChangeInput,
  RiderDeliveryChangeRequest,
} from '../types/delivery-change-request.types';

export function listMyPendingDeliveryChanges(token: string) {
  return mobileApiGet<RiderDeliveryChangeRequest[]>({
    path: '/deliveries/dd/change-requests/mine',
    token,
  });
}

export function submitRiderDeliveryChange(
  token: string,
  parcelId: string,
  input: RiderDeliveryChangeInput,
) {
  return mobileApiPost<{ id: string }>({
    path: `/deliveries/dd/${parcelId}/change-request`,
    token,
    body: input,
  });
}
