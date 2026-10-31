import { db } from '@/db/config';
import { Conflict } from '@/server/utils/http-error';
import { resolveReceivingPickupLocationsRepo } from '../../locations';
import {
  getBulkArrivalCandidatesRepo,
  markIncomingParcelsArrivedRepo,
} from '../parcel-bulk-receiving.repository';
import { assertBulkArrivalCandidates } from './rules';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type ReceiveIncomingInput = {
  parcelIds: string[];
  companyId: string;
  branchId: string;
  actorUserId: string;
  receivedAt: Date;
};
export async function receiveIncomingParcels(tx: Transaction, input: ReceiveIncomingInput) {
  const candidates = await getBulkArrivalCandidatesRepo(input.parcelIds, tx);
  assertBulkArrivalCandidates({ ...input, requestedParcelIds: input.parcelIds, candidates });
  const resolvedLocations = await resolveReceivingPickupLocationsRepo(
    input.companyId,
    candidates,
    tx,
  );
  const updated = await markIncomingParcelsArrivedRepo(
    {
      ...input,
      receivedBy: input.actorUserId,
      resolvedLocations,
    },
    tx,
  );
  if (updated.length !== input.parcelIds.length)
    throw Conflict('The selected parcels changed while the batch was being processed');
  return updated.map((parcel) => parcel.id);
}
