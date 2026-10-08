import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, parcels, pickupQueues, users } from '@/db/schemas';
import { ParcelStatus, UserStatus } from '@/db/schemas/enums';
import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';

export async function updateParcelShelfPickerSvc(input: {
  parcelId: string;
  userId: string;
  companyId: string;
  branchId: string;
  locationId?: string | null;
  actorUserId: string;
  expectedPickerStaffId?: string | null;
}) {
  return db.transaction(async (tx) => {
    const [parcel] = await tx
      .select()
      .from(parcels)
      .where(
        and(
          eq(parcels.id, input.parcelId),
          eq(parcels.companyId, input.companyId),
          eq(parcels.destinationId, input.branchId),
          eq(parcels.isDeleted, false),
          isNull(parcels.deletedAt),
        ),
      )
      .for('update');
    if (!parcel) throw NotFound('Parcel not found at your branch');
    if (parcel.status !== ParcelStatus.AWAITING_PICKUP || parcel.confirmedAt)
      throw Conflict('Only parcels awaiting pickup can have their shelf picker changed');

    const queues = await tx
      .select()
      .from(pickupQueues)
      .where(and(eq(pickupQueues.parcelId, input.parcelId), isNull(pickupQueues.endedAt)))
      .orderBy(desc(pickupQueues.queuedAt), desc(pickupQueues.id))
      .for('update');
    if (
      queues.some(
        (queue) => queue.companyId !== input.companyId || queue.branchId !== input.branchId,
      )
    )
      throw Conflict('Pickup ticket does not belong to your branch');
    const previousPickerStaffId = parcel.shelfPickerStaffId ?? queues[0]?.pickerStaffId ?? null;
    if (
      input.expectedPickerStaffId !== undefined &&
      input.expectedPickerStaffId !== previousPickerStaffId
    )
      throw Conflict('Shelf picker assignment changed; refresh and review it again');

    const [staff] = await tx
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.id, input.userId),
          eq(users.companyId, input.companyId),
          eq(users.branchId, input.branchId),
          eq(users.status, UserStatus.ACTIVE),
          input.locationId ? eq(users.locationId, input.locationId) : undefined,
        ),
      )
      .for('share');
    if (!staff)
      throw BadRequest('Select an active staff member at your branch and assigned location');

    const changed =
      parcel.shelfPickerStaffId !== staff.id ||
      queues.some((queue) => queue.pickerStaffId !== staff.id);
    if (changed) {
      const updatedAt = new Date();
      await tx
        .update(parcels)
        .set({ shelfPickerStaffId: staff.id, updatedAt })
        .where(eq(parcels.id, parcel.id));
      if (queues.length)
        await tx
          .update(pickupQueues)
          .set({ pickerStaffId: staff.id, updatedAt })
          .where(and(eq(pickupQueues.parcelId, parcel.id), isNull(pickupQueues.endedAt)));
      await tx.insert(auditLogs).values({
        companyId: input.companyId,
        actorUserId: input.actorUserId,
        entityType: 'parcel',
        entityId: parcel.id,
        action: previousPickerStaffId
          ? 'PARCEL_SHELF_PICKER_REASSIGNED'
          : 'PARCEL_SHELF_PICKER_ASSIGNED',
        message: `Shelf pickup assignment updated for ${parcel.bookingCode}`,
        metadata: {
          previousPickerStaffId,
          pickerStaffId: staff.id,
          pickupQueueIds: queues.map((queue) => queue.id),
        },
      });
    }
    return {
      success: true,
      parcelId: parcel.id,
      pickerStaffId: staff.id,
      changed: Boolean(changed),
    };
  });
}
