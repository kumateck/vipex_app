import { db } from '@/db/config';
import { BadRequest } from '@/server/utils/http-error';
import { recordAuditLog } from '../audit/logger';
import { normalizeBulkArrivalParcelIds, receiveIncomingParcels } from './parcel-receiving';
export { assertBulkArrivalCandidates, normalizeBulkArrivalParcelIds } from './parcel-receiving';

export async function markIncomingParcelsArrivedSvc(input: {
  parcelIds: string[];
  companyId: string;
  branchId: string;
  actorUserId: string;
  receivedAt?: Date;
}) {
  if (!input.companyId || !input.branchId || !input.actorUserId)
    throw BadRequest('Company, receiving branch, and user context are required');
  const parcelIds = normalizeBulkArrivalParcelIds(input.parcelIds);
  const receivedAt = input.receivedAt ?? new Date();
  if (!Number.isFinite(receivedAt.getTime())) throw BadRequest('Enter a valid receipt timestamp');
  const updatedIds = await db.transaction((tx) =>
    receiveIncomingParcels(tx, { ...input, parcelIds, receivedAt }),
  );
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'parcel_batch',
    action: 'PARCELS_BULK_RECEIVED',
    message: `${updatedIds.length} incoming parcels marked as arrived`,
    metadata: {
      parcelIds: updatedIds,
      branchId: input.branchId,
      receivedAt: receivedAt.toISOString(),
    },
  });
  return {
    parcelIds: updatedIds,
    updatedCount: updatedIds.length,
    receivedAt: receivedAt.toISOString(),
  };
}
