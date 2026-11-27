import { db } from '@/db/config';
import { auditLogs } from '@/db/schemas';
import { BadRequest, Conflict, Forbidden, NotFound } from '@/server/utils/http-error';
import {
  getDestinationChangePhase,
  normalizeDestinationChangeReason,
  type ParcelDestinationOptions,
} from '@/shared/shipments/parcel-destination-change';
import { resolveReceivingPickupLocationsRepo } from '../../locations';
import { applyDestinationChange } from './apply';
import { findDestinationChangeBlocker } from './guards';
import {
  findCompanyBranchNamesRepo,
  findLocationNameRepo,
  findParcelDestinationStateRepo,
  listDestinationBranchesRepo,
} from './repository';

type Actor = { companyId?: string | null; actorUserId: string };

function companyOf(actor: Actor) {
  if (!actor.companyId) throw Forbidden('Company context is required');
  return actor.companyId;
}

export async function getParcelDestinationOptionsSvc(
  input: Actor & { parcelId: string },
): Promise<ParcelDestinationOptions> {
  const companyId = companyOf(input);
  const parcel = await findParcelDestinationStateRepo({ parcelId: input.parcelId, companyId });
  if (!parcel) throw NotFound('Parcel not found');
  const restriction = await findDestinationChangeBlocker(parcel, db);
  return {
    restriction,
    phase: restriction ? null : getDestinationChangePhase(parcel.status),
    sourceId: parcel.sourceId,
    destinationId: parcel.destinationId,
    pickupLocationId: parcel.pickupLocationId,
    branches: restriction
      ? []
      : await listDestinationBranchesRepo({ companyId, excludeBranchId: parcel.sourceId }),
  };
}

export async function changeParcelDestinationSvc(
  input: Actor & {
    parcelId: string;
    destinationId: string;
    pickupLocationId?: string | null;
    expectedDestinationId: string;
    expectedPickupLocationId: string | null;
    reason: string;
  },
) {
  const companyId = companyOf(input);
  const reason = normalizeDestinationChangeReason(input.reason);
  if (!reason) throw BadRequest('Enter a reason between 5 and 500 characters');

  return db.transaction(async (tx) => {
    const parcel = await findParcelDestinationStateRepo(
      { parcelId: input.parcelId, companyId, lock: true },
      tx,
    );
    if (!parcel) throw NotFound('Parcel not found');
    const restriction = await findDestinationChangeBlocker(parcel, tx);
    if (restriction) throw Conflict(restriction);
    const phase = getDestinationChangePhase(parcel.status)!;
    if (
      parcel.destinationId !== input.expectedDestinationId ||
      parcel.pickupLocationId !== input.expectedPickupLocationId
    )
      throw Conflict('The parcel destination changed. Reopen the parcel before saving.');
    if (input.destinationId === parcel.sourceId)
      throw BadRequest('Destination branch must differ from the source branch');

    const names = await findCompanyBranchNamesRepo(
      companyId,
      [parcel.destinationId, input.destinationId],
      tx,
    );
    const target = names.get(input.destinationId);
    if (!target || target.isDeleted) throw BadRequest('Choose an active destination branch');
    const [resolved] = await resolveReceivingPickupLocationsRepo(
      companyId,
      [{ destinationId: input.destinationId, pickupLocationId: input.pickupLocationId ?? null }],
      tx,
    );
    const pickupLocationId = resolved!.pickupLocationId;
    if (
      input.destinationId === parcel.destinationId &&
      pickupLocationId === parcel.pickupLocationId
    )
      return { id: parcel.id, changed: false };

    const { clearedReceivingOffice } = await applyDestinationChange(tx, {
      parcel,
      phase,
      destinationId: input.destinationId,
      pickupLocationId,
      actorUserId: input.actorUserId,
    });
    const [previousLocationName, pickupLocationName] = await Promise.all([
      findLocationNameRepo(parcel.pickupLocationId, tx),
      findLocationNameRepo(pickupLocationId, tx),
    ]);
    await tx.insert(auditLogs).values({
      companyId,
      actorUserId: input.actorUserId,
      entityType: 'parcel',
      entityId: parcel.id,
      action: 'PARCEL_DESTINATION_CHANGED',
      message: `Destination changed to ${target.name} for ${parcel.bookingCode}`,
      metadata: {
        previousDestinationId: parcel.destinationId,
        previousDestinationName: names.get(parcel.destinationId)?.name ?? null,
        previousPickupLocationId: parcel.pickupLocationId,
        previousPickupLocationName: previousLocationName,
        phase,
        previousStatus: parcel.status,
        previousReceivedAt: phase === 'forward' ? parcel.receivedAt : undefined,
        removedConsignmentId: parcel.activeConsignmentId ?? undefined,
        previousReceivingOfficeId: clearedReceivingOffice ? parcel.receivingOfficeId : undefined,
        destinationId: input.destinationId,
        destinationName: target.name,
        pickupLocationId,
        pickupLocationName,
        reason,
      },
    });
    return { id: parcel.id, changed: true };
  });
}
