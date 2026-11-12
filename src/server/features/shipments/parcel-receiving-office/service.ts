import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/config';
import { locations, parcels, receivingOffices } from '@/db/schemas';
import { canAssignReceivingOffice } from '@/shared/shipments/receiving-office';
import { BadRequest, Conflict, Forbidden, NotFound } from '@/server/utils/http-error';
import { recordAuditLog } from '../../audit/logger';
import { parcelAtPickupLocation } from './projection';

export async function assignReceivingOffice(input: {
  parcelId: string;
  officeId: string;
  companyId?: string | null;
  branchId?: string | null;
  actorUserId: string;
}) {
  const { companyId, branchId } = input;
  if (!companyId || !branchId) throw Forbidden('Receiving branch context is required');

  const assignment = await db.transaction(async (tx) => {
    const [parcel] = await tx
      .select({
        status: parcels.status,
        atPickupLocation: parcelAtPickupLocation,
        locationId: parcels.pickupLocationId,
        officeId: parcels.receivingOfficeId,
      })
      .from(parcels)
      .where(
        and(
          eq(parcels.id, input.parcelId),
          eq(parcels.companyId, companyId),
          eq(parcels.destinationId, branchId),
          eq(parcels.isDeleted, false),
          isNull(parcels.deletedAt),
          isNull(parcels.confirmedAt),
        ),
      )
      .for('update');
    if (!parcel) throw NotFound('Parcel is unavailable');
    if (!canAssignReceivingOffice(parcel.status) || !parcel.atPickupLocation)
      throw Conflict(
        'Only parcels held at the destination for collection or delivery can be assigned',
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
      await tx
        .update(parcels)
        .set({ receivingOfficeId: office.id, updatedAt: new Date() })
        .where(eq(parcels.id, input.parcelId));
    }
    return { office, previousOfficeId: parcel.officeId };
  });

  if (assignment.previousOfficeId !== assignment.office.id) {
    await recordAuditLog({
      companyId,
      actorUserId: input.actorUserId,
      entityType: 'parcel',
      entityId: input.parcelId,
      action: 'PARCEL_RECEIVING_OFFICE_CHANGED',
      message: `Receiving office set to ${assignment.office.name}`,
      metadata: {
        previousReceivingOfficeId: assignment.previousOfficeId,
        receivingOfficeId: assignment.office.id,
      },
    });
  }

  return { receivingOfficeId: assignment.office.id, receivingOfficeName: assignment.office.name };
}
