import { ParcelStatus } from '@mobile/constants/parcel-status';
import {
  createPickupQueue,
  getParcelDetails,
  listPickupQueueCards,
  searchParcels,
} from '@mobile/lib/api';
import { buildQueueBoardQueries } from './queue-management-queries';

export function loadQueueBoards(
  token: string,
  branchId: string,
  access: { receiver: boolean; sender: boolean },
) {
  const [receiverQuery, senderQuery] = buildQueueBoardQueries(branchId, access);
  return Promise.all([
    receiverQuery ? listPickupQueueCards(token, receiverQuery) : Promise.resolve([]),
    senderQuery ? listPickupQueueCards(token, senderQuery) : Promise.resolve([]),
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
    pickupQueueTodayOnly: true,
    page: 1,
    pageSize: 20,
  });
}

export function loadQueueParcelDetails(token: string, parcelId: string) {
  return getParcelDetails(token, parcelId, { pickupQueueTodayOnly: true });
}

export function issueQueueTicket(token: string, parcelId: string) {
  return createPickupQueue(token, { parcelId });
}
