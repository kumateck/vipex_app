import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcels, ParcelStatus } from '@/db/schemas';
import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import { recordAuditLog } from '../audit/logger';

export type CallOutcome = 'follow_up' | 'pickup' | 'delivery';

const eligibleStatuses = [
  ParcelStatus.ARRIVED_AT_DESTINATION,
  ParcelStatus.RETURNED_TO_OFFICE,
  ParcelStatus.CUSTOMER_CONTACTED,
  ParcelStatus.AWAITING_PICKUP,
  ParcelStatus.HOME_DELIVERY_REQUESTED,
];

export function callOutcomeStatus(outcome: CallOutcome) {
  if (outcome === 'follow_up') return ParcelStatus.CUSTOMER_CONTACTED;
  if (outcome === 'pickup') return ParcelStatus.AWAITING_PICKUP;
  if (outcome === 'delivery') return ParcelStatus.HOME_DELIVERY_REQUESTED;
  return ParcelStatus.AWAITING_PICKUP;
}

export function validateBulkCallOutcomeCandidates(
  candidates: Array<{
    id: string;
    companyId: string;
    destinationId: string;
    callCenterAssignedToUserId: string | null;
    isDeleted: boolean;
    status: number;
    callCenterCalledAt?: Date | null;
  }>,
  parcelIds: string[],
  context: { companyId: string; branchId: string; actorUserId: string },
) {
  if (
    candidates.length !== parcelIds.length ||
    candidates.some(
      (parcel) =>
        parcel.companyId !== context.companyId ||
        parcel.destinationId !== context.branchId ||
        parcel.callCenterAssignedToUserId !== context.actorUserId ||
        parcel.isDeleted,
    )
  ) {
    throw NotFound('One or more selected parcels are unavailable');
  }
  if (
    candidates.some(
      (parcel) => !eligibleStatuses.includes(parcel.status) || parcel.callCenterCalledAt,
    )
  ) {
    throw Conflict('One or more selected parcels no longer allow a call outcome');
  }
}

export async function saveBulkCallOutcomeSvc(input: {
  parcelIds: string[];
  outcome: CallOutcome;
  companyId: string;
  branchId: string;
  actorUserId: string;
}) {
  if (!input.companyId || !input.branchId || !input.actorUserId) {
    throw BadRequest('Company, branch, and user context are required');
  }
  const { parcelIds } = input;
  if (
    parcelIds.length < 1 ||
    parcelIds.length > 100 ||
    new Set(parcelIds).size !== parcelIds.length
  ) {
    throw BadRequest('Select 1 to 100 unique parcels');
  }
  const status = callOutcomeStatus(input.outcome);
  await db.transaction(async (tx) => {
    const candidates = await tx
      .select({
        id: parcels.id,
        companyId: parcels.companyId,
        destinationId: parcels.destinationId,
        callCenterAssignedToUserId: parcels.callCenterAssignedToUserId,
        isDeleted: parcels.isDeleted,
        status: parcels.status,
        callCenterCalledAt: parcels.callCenterCalledAt,
      })
      .from(parcels)
      .where(inArray(parcels.id, parcelIds));
    validateBulkCallOutcomeCandidates(candidates, parcelIds, input);

    const updated = await tx
      .update(parcels)
      .set({ status, callCenterCalledAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          inArray(parcels.id, parcelIds),
          eq(parcels.companyId, input.companyId),
          eq(parcels.destinationId, input.branchId),
          eq(parcels.callCenterAssignedToUserId, input.actorUserId),
          eq(parcels.isDeleted, false),
          isNull(parcels.callCenterCalledAt),
          inArray(parcels.status, eligibleStatuses),
        ),
      )
      .returning({ id: parcels.id });
    if (updated.length !== parcelIds.length) {
      throw Conflict('The selected parcels changed while the batch was being processed');
    }
  });

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'parcel_batch',
    action: 'PARCELS_BULK_CALL_OUTCOME',
    message: `${parcelIds.length} parcel call outcomes saved`,
    metadata: { parcelIds, outcome: input.outcome, status },
  });
  return { parcelIds, updatedCount: parcelIds.length, status };
}
