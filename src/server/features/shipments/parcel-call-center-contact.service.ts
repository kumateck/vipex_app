import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/db/config';
import { ParcelStatus, customers, parcels } from '@/db/schemas';
import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import { recordAuditLog } from '../audit/logger';
import { callOutcomeStatus, type CallOutcome } from './parcel-bulk-call-outcome.service';

const outcomeStatuses = [
  ParcelStatus.ARRIVED_AT_DESTINATION,
  ParcelStatus.CUSTOMER_CONTACTED,
  ParcelStatus.RETURNED_TO_OFFICE,
  ParcelStatus.AWAITING_PICKUP,
  ParcelStatus.HOME_DELIVERY_REQUESTED,
];

const callableStatuses = [
  ...outcomeStatuses,
  ParcelStatus.ADDRESS_COLLECTED,
  ParcelStatus.DISPATCHED,
  ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
];

export function assertCallCenterContactCandidate<
  T extends {
    companyId: string;
    destinationId: string;
    callCenterAssignedToUserId: string | null;
    callCenterCalledAt: Date | null;
    status: number;
    isDeleted: boolean;
  },
>(
  parcel: T | null | undefined,
  input: { companyId: string; branchId: string; actorUserId: string; outcome?: CallOutcome },
): asserts parcel is T {
  if (
    !parcel ||
    parcel.isDeleted ||
    parcel.companyId !== input.companyId ||
    parcel.destinationId !== input.branchId ||
    parcel.callCenterAssignedToUserId !== input.actorUserId
  )
    throw NotFound('Assigned parcel not found at your branch');
  if (parcel.callCenterCalledAt || !callableStatuses.includes(parcel.status)) {
    throw Conflict('This parcel no longer needs a call');
  }
  if (input.outcome && !outcomeStatuses.includes(parcel.status)) {
    throw Conflict('This parcel can no longer change its call outcome');
  }
}

export async function recordCallCenterContactSvc(input: {
  parcelId: string;
  companyId: string;
  branchId: string;
  actorUserId: string;
  outcome?: CallOutcome;
  secondReceiverId?: string | null;
}) {
  if (!input.companyId || !input.branchId) throw BadRequest('Company and branch are required');
  if (input.secondReceiverId !== undefined && !input.outcome) {
    throw BadRequest('Second receiver can change only with a call outcome');
  }
  const result = await db.transaction(async (tx) => {
    const [parcel] = await tx
      .select({
        id: parcels.id,
        companyId: parcels.companyId,
        destinationId: parcels.destinationId,
        callCenterAssignedToUserId: parcels.callCenterAssignedToUserId,
        callCenterCalledAt: parcels.callCenterCalledAt,
        status: parcels.status,
        isDeleted: parcels.isDeleted,
      })
      .from(parcels)
      .where(eq(parcels.id, input.parcelId));
    assertCallCenterContactCandidate(parcel, input);
    if (input.secondReceiverId) {
      const [receiver] = await tx
        .select({ id: customers.id })
        .from(customers)
        .where(
          and(
            eq(customers.id, input.secondReceiverId),
            eq(customers.companyId, input.companyId),
            eq(customers.isDeleted, false),
          ),
        )
        .limit(1);
      if (!receiver) throw NotFound('Second receiver not found in your company');
    }
    const status = input.outcome ? callOutcomeStatus(input.outcome) : parcel.status;
    const now = new Date();
    const [updated] = await tx
      .update(parcels)
      .set({
        status,
        ...(input.secondReceiverId !== undefined
          ? { secondReceiverId: input.secondReceiverId }
          : {}),
        callCenterCalledAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(parcels.id, input.parcelId),
          eq(parcels.companyId, input.companyId),
          eq(parcels.destinationId, input.branchId),
          eq(parcels.callCenterAssignedToUserId, input.actorUserId),
          eq(parcels.status, parcel.status),
          eq(parcels.isDeleted, false),
          isNull(parcels.callCenterCalledAt),
          inArray(parcels.status, input.outcome ? outcomeStatuses : callableStatuses),
        ),
      )
      .returning({ id: parcels.id });
    if (!updated) throw Conflict('Parcel changed while recording the call');
    return { id: updated.id, status, calledAt: now.toISOString() };
  });
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'parcel',
    entityId: input.parcelId,
    action: 'PARCEL_CALL_CENTER_CALLED',
    message: 'Call center recorded a customer call',
    metadata: { outcome: input.outcome ?? null, status: result.status },
  });
  return result;
}
