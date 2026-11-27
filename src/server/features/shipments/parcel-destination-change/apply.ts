import { eq } from 'drizzle-orm';
import { parcels, ParcelStatus } from '@/db/schemas';
import type { DestinationChangePhase } from '@/shared/shipments/parcel-destination-change';
import { endPickupQueueForParcelSvc } from '../../pickup-queues/service';
import {
  removeFromActiveConsignmentRepo,
  type Executor,
  type ParcelDestinationState,
} from './repository';

/**
 * Writes the new destination and the custody side effects for the parcel's phase.
 * Forwarding returns an arrived parcel to In Transit so the new branch can receive it, and
 * clears everything the old branch attached on arrival.
 */
export async function applyDestinationChange(
  tx: Executor,
  input: {
    parcel: ParcelDestinationState;
    phase: DestinationChangePhase;
    destinationId: string;
    pickupLocationId: string | null;
    actorUserId: string;
  },
) {
  const { parcel, phase } = input;
  const forward = phase === 'forward';
  const clearOffice = forward || input.pickupLocationId !== parcel.pickupLocationId;
  if (parcel.activeConsignmentId) await removeFromActiveConsignmentRepo(parcel.id, tx);
  await tx
    .update(parcels)
    .set({
      destinationId: input.destinationId,
      pickupLocationId: input.pickupLocationId,
      ...(clearOffice ? { receivingOfficeId: null } : {}),
      ...(forward
        ? {
            status: ParcelStatus.IN_TRANSIT,
            receivedAt: null,
            receivedBy: null,
            shelfPickerStaffId: null,
            callCenterAssignedToUserId: null,
            callCenterCalledAt: null,
          }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(parcels.id, parcel.id));
  if (forward)
    await endPickupQueueForParcelSvc({ parcelId: parcel.id, endedBy: input.actorUserId }, tx);
  return { clearedReceivingOffice: clearOffice && parcel.receivingOfficeId !== null };
}
