import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcels, users, UserStatus } from '@/db/schemas';
import { BadRequest, NotFound } from '@/server/utils/http-error';
import { callCenterAssignmentStatus } from './parcel-call-center-assignment';
import {
  callCenterParcelFilters,
  isParcelInCallCenterScope,
  type CallCenterScope,
} from './call-center-scope';

type AssignmentInput = CallCenterScope & { userId: string };

export async function bulkAssignParcelsToCallCenterSvc(
  input: AssignmentInput & { parcelIds: string[] },
) {
  const scope = callCenterParcelFilters(input);
  if (
    input.parcelIds.length < 1 ||
    input.parcelIds.length > 200 ||
    new Set(input.parcelIds).size !== input.parcelIds.length
  )
    throw BadRequest('Select 1 to 200 unique parcels');

  await db.transaction(async (tx) => {
    const candidates = await tx
      .select({
        id: parcels.id,
        companyId: parcels.companyId,
        destinationId: parcels.destinationId,
        pickupLocationId: parcels.pickupLocationId,
        isDeleted: parcels.isDeleted,
        deletedAt: parcels.deletedAt,
        status: parcels.status,
      })
      .from(parcels)
      .where(inArray(parcels.id, input.parcelIds))
      .orderBy(parcels.id)
      .for('update');
    if (
      candidates.length !== input.parcelIds.length ||
      candidates.some(
        (parcel) =>
          parcel.isDeleted || parcel.deletedAt || !isParcelInCallCenterScope(parcel, input),
      )
    )
      throw NotFound('One or more selected parcels are unavailable at your branch and location');

    const [staff] = await tx
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.id, input.userId),
          eq(users.companyId, scope.companyId),
          eq(users.branchId, scope.destinationId),
          eq(users.status, UserStatus.ACTIVE),
          scope.locationId ? eq(users.locationId, scope.locationId) : undefined,
        ),
      )
      .for('share');
    if (!staff)
      throw BadRequest('Select an active staff member at your branch and assigned location');

    for (const parcel of candidates) {
      await tx
        .update(parcels)
        .set({
          callCenterAssignedToUserId: staff.id,
          callCenterCalledAt: null,
          status: callCenterAssignmentStatus(parcel.status),
          updatedAt: new Date(),
        })
        .where(eq(parcels.id, parcel.id));
    }
  });
  return { success: true, assignedCount: input.parcelIds.length };
}

export async function assignParcelToCallCenterSvc(input: AssignmentInput & { parcelId: string }) {
  await bulkAssignParcelsToCallCenterSvc({ ...input, parcelIds: [input.parcelId] });
  return { success: true, parcelId: input.parcelId };
}
