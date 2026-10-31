import { ParcelStatus, UserStatus } from '@/db/schemas/enums';
import { BadRequest, Forbidden } from '@/server/utils/http-error';
import { getUserByIdRepo } from '../../auth/repository';
import { markIncomingParcelsArrivedSvc } from '../parcel-bulk-receiving.service';

export async function markParcelReceivedSvc(
  id: string,
  input: { receivedBy: string; receivedAt?: string; status?: number },
) {
  if (input.status !== undefined && input.status !== ParcelStatus.ARRIVED_AT_DESTINATION)
    throw BadRequest('Receiving must set Arrived at Destination');
  const actor = await getUserByIdRepo(input.receivedBy);
  if (!actor || actor.status !== UserStatus.ACTIVE)
    throw Forbidden('An active receiving user is required');
  const result = await markIncomingParcelsArrivedSvc({
    parcelIds: [id],
    companyId: actor.companyId,
    branchId: actor.branchId,
    actorUserId: actor.id,
    receivedAt: input.receivedAt ? new Date(input.receivedAt) : undefined,
  });
  return { id, receivedAt: result.receivedAt };
}
