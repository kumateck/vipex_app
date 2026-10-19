import { mobileApiPost, riderReturnedToOffice } from '@mobile/lib/api';
import type { DeliveryHandoverInput } from '../types';
import { submitRiderHandover } from './submit-rider-handover';

export function completeAssignedDelivery(
  token: string,
  parcelId: string,
  riderUserId: string,
  handover: DeliveryHandoverInput,
) {
  return submitRiderHandover(handover, riderUserId, (body) =>
    mobileApiPost<{ id: string }>({
      path: `/deliveries/dd/${parcelId}/rider-given`,
      token,
      body,
    }),
  );
}

export function returnAssignedDelivery(token: string, parcelId: string, riderUserId: string) {
  return riderReturnedToOffice(token, { parcelId, riderUserId });
}
