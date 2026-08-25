import { riderGivenToCustomer, riderReturnedToOffice } from '@mobile/lib/api';
import type { DeliveryHandoverInput } from '../types';

export function completeAssignedDelivery(
  token: string,
  parcelId: string,
  riderUserId: string,
  handover: DeliveryHandoverInput,
) {
  return riderGivenToCustomer(token, {
    parcelId,
    riderUserId,
    ...handover,
  });
}

export function returnAssignedDelivery(token: string, parcelId: string, riderUserId: string) {
  return riderReturnedToOffice(token, { parcelId, riderUserId });
}
