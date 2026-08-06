import { ParcelStatus } from '@mobile/constants/parcel-status';
import {
  createPickupQueue,
  getParcelDetails,
  listPickupQueueCards,
  searchParcels,
} from '@mobile/lib/api';

export function loadQueueBoards(token: string, branchId: string) {
  return Promise.all([
    listPickupQueueCards(token, { branchId, paymentBucket: 'TP' }),
    listPickupQueueCards(token, { branchId, paymentBucket: 'SP' }),
  ]);
}

export function searchQueueParcels(
  token: string,
  input: { search: string; companyId: string; branchId?: string },
) {
  return searchParcels(token, {
    search: input.search,
    companyId: input.companyId,
    destinationId: input.branchId,
    status: ParcelStatus.AWAITING_PICKUP,
    page: 1,
    pageSize: 20,
  });
}

export function loadQueueParcelDetails(token: string, parcelId: string) {
  return getParcelDetails(token, parcelId);
}

export function issueQueueTicket(token: string, parcelId: string) {
  return createPickupQueue(token, { parcelId });
}
