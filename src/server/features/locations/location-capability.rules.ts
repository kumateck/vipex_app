import { BadRequest } from '@/server/utils/http-error';

export function assertReceivingLocation(
  location: {
    companyId: string;
    branchId: string;
    isDeleted: boolean;
    canReceive: boolean;
  } | null,
  companyId: string,
  destinationId: string,
) {
  if (
    !location ||
    location.isDeleted ||
    location.companyId !== companyId ||
    location.branchId !== destinationId
  ) {
    throw BadRequest('Select a valid destination location');
  }
  if (!location.canReceive) throw BadRequest('This location does not receive parcels');
}

export function assertSendingLocation(
  location: {
    companyId: string;
    branchId: string;
    isDeleted: boolean;
    canSend: boolean;
  } | null,
  companyId: string,
  sourceId: string,
) {
  if (
    !location ||
    location.isDeleted ||
    location.companyId !== companyId ||
    location.branchId !== sourceId
  ) {
    throw BadRequest('Select a valid source location');
  }
  if (!location.canSend) throw BadRequest('This location does not send parcels');
}
