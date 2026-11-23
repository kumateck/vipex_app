import { ParcelStatus, UserStatus } from '@/db/schemas/enums';
import { BadRequest, Forbidden } from '@/server/utils/http-error';
import { getUserByIdRepo } from '../../auth/repository';
import { markIncomingParcelsArrivedSvc } from '../parcel-bulk-receiving.service';

export async function markParcelReceivedSvc(
  id: string,
  input: {
    receivedBy: string;
    companyId: string;
    branchId: string;
    receivedAt?: string;
    status?: number;
    receivingOfficeId?: string;
  },
) {
  if (!input.companyId || !input.branchId)
    throw BadRequest('Authenticated company and receiving branch are required');
  if (input.status !== undefined && input.status !== ParcelStatus.ARRIVED_AT_DESTINATION)
    throw BadRequest('Receiving must set Arrived at Destination');
  const actor = await getUserByIdRepo(input.receivedBy);
  if (!actor || actor.status !== UserStatus.ACTIVE)
    throw Forbidden('An active receiving user is required');
  if (actor.companyId !== input.companyId)
    throw Forbidden('Receiving user is outside the authenticated company');
  const result = await markIncomingParcelsArrivedSvc({
    parcelIds: [id],
    companyId: input.companyId,
    branchId: input.branchId,
    actorUserId: actor.id,
    receivingOfficeId: input.receivingOfficeId,
    receivedAt: input.receivedAt ? new Date(input.receivedAt) : undefined,
  });
  return { id, receivedAt: result.receivedAt };
}
