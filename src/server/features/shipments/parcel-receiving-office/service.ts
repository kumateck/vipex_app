import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, locations, parcels, receivingOffices } from '@/db/schemas';
import {
  canAssignReceivingOffice,
  isDeliveredOfficeCorrection,
} from '@/shared/shipments/receiving-office';
import { BadRequest, Conflict, Forbidden, NotFound } from '@/server/utils/http-error';
import { parcelAtPickupLocation } from './projection';

export async function assignReceivingOffice(input: {
  parcelId: string;
  officeId: string;
  expectedReceivingOfficeId?: string | null;
  companyId?: string | null;
  branchId?: string | null;
  actorUserId: string;
}) {
  const { companyId, branchId } = input;
  if (!companyId || !branchId) throw Forbidden('Receiving branch context is required');

  return db.transaction(async (tx) => {
    const [parcel] = await tx
      .select({
        status: parcels.status,
        atPickupLocation: parcelAtPickupLocation,
        locationId: parcels.pickupLocationId,
        officeId: parcels.receivingOfficeId,
        confirmedAt: parcels.confirmedAt,
      })
      .from(parcels)
      .where(
        and(
          eq(parcels.id, input.parcelId),
          eq(parcels.companyId, companyId),
          eq(parcels.destinationId, branchId),
          eq(parcels.isDeleted, false),
          isNull(parcels.deletedAt),
        ),
      )
      .for('update');
    if (!parcel) throw NotFound('Parcel is unavailable');
    const historicalCorrection = isDeliveredOfficeCorrection(parcel.status) && !!parcel.officeId;
    const heldForCollection =
      canAssignReceivingOffice(parcel.status) && !parcel.confirmedAt && parcel.atPickupLocation;
    if (!historicalCorrection && !heldForCollection)
      throw Conflict(
        'The parcel must be at the pickup location or have an existing office on a delivered parcel',
      );
    if (!parcel.locationId)
      throw BadRequest('Set the parcel’s pickup location before assigning an office');

    const [location] = await tx
      .select({ id: locations.id })
      .from(locations)
      .where(
        and(
          eq(locations.id, parcel.locationId),
          eq(locations.companyId, companyId),
          eq(locations.branchId, branchId),
          eq(locations.isDeleted, false),
          eq(locations.canReceive, true),
        ),
      )
      .for('share');
    if (!location) throw BadRequest('The parcel’s pickup location cannot receive parcels');

    const [office] = await tx
      .select({ id: receivingOffices.id, name: receivingOffices.name })
      .from(receivingOffices)
      .where(
        and(eq(receivingOffices.id, input.officeId), eq(receivingOffices.locationId, location.id)),
      )
      .for('share');
    if (!office) throw BadRequest('Choose a receiving office at the parcel’s pickup location');

    if (parcel.officeId !== office.id) {
      if (
        input.expectedReceivingOfficeId !== undefined &&
        input.expectedReceivingOfficeId !== parcel.officeId
      ) {
        throw Conflict('The receiving office changed. Reopen the parcel before saving.');
      }
      const [previousOffice] = parcel.officeId
        ? await tx
            .select({ name: receivingOffices.name })
            .from(receivingOffices)
            .where(eq(receivingOffices.id, parcel.officeId))
        : [];
      await tx
        .update(parcels)
        .set({ receivingOfficeId: office.id, updatedAt: new Date() })
        .where(eq(parcels.id, input.parcelId));
      await tx.insert(auditLogs).values({
        companyId,
        actorUserId: input.actorUserId,
        entityType: 'parcel',
        entityId: input.parcelId,
        action: 'PARCEL_RECEIVING_OFFICE_CHANGED',
        message: `Receiving office set to ${office.name}`,
        metadata: {
          branchId,
          previousReceivingOfficeId: parcel.officeId,
          previousReceivingOfficeName: previousOffice?.name ?? null,
          receivingOfficeId: office.id,
          receivingOfficeName: office.name,
        },
      });
    }
    return { receivingOfficeId: office.id, receivingOfficeName: office.name };
  });
}
