import { and, eq } from 'drizzle-orm';
import { parcels, ParcelStatus } from '@/db/schemas';
import { Conflict, NotFound } from '@/server/utils/http-error';
import type { DbExecutor } from '../../../shipments/parcel-repositories/parcel-repository.types';

export type Scope = { companyId: string; branchId: string };
export type Action = Scope & { parcelId: string; handoverId: string; actorId: string };

export function parcelScope(input: Scope) {
  return and(
    eq(parcels.companyId, input.companyId),
    eq(parcels.destinationId, input.branchId),
    eq(parcels.isDeleted, false),
  );
}

export async function lockParcel(input: Action, tx: DbExecutor) {
  const [parcel] = await tx
    .select()
    .from(parcels)
    .where(and(parcelScope(input), eq(parcels.id, input.parcelId)))
    .for('update');
  if (!parcel) throw NotFound('Parcel not found at this branch');
  return parcel;
}

export function getPending(parcel: typeof parcels.$inferSelect, handoverId: string) {
  const pending = parcel.pendingReceiverHandover;
  if (pending?.id !== handoverId || parcel.status !== ParcelStatus.AWAITING_PICKUP) {
    throw Conflict('This handover changed. Reopen the parcel.');
  }
  const collectorId =
    pending.handoverTarget === 'main' ? parcel.receiverId : parcel.secondReceiverId;
  if (pending.receiverId !== parcel.receiverId || pending.collectorId !== collectorId) {
    throw Conflict('The parcel receiver changed. Ask a supervisor to review the handover.');
  }
  return pending;
}
