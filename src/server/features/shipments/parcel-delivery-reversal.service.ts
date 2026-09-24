import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import { db } from '@/db/config';
import { deliveries, parcels, pickupQueues, ParcelStatus } from '@/db/schemas';
import { BadRequest, Conflict, NotFound } from '../../utils/http-error';
import { recordAuditLog } from '../audit/logger';

export async function reverseParcelDeliverySvc(input: {
  parcelId: string;
  companyId: string;
  branchId: string;
  actorUserId: string;
  reason: string;
}) {
  const reason = input.reason.trim();
  if (reason.length < 5) throw BadRequest('Enter a reason of at least 5 characters');
  if (!input.companyId || !input.branchId) throw BadRequest('A company and branch are required');

  const previous = await db.transaction(async (tx) => {
    const [parcel] = await tx
      .select({
        id: parcels.id,
        bookingCode: parcels.bookingCode,
        status: parcels.status,
        confirmedAt: parcels.confirmedAt,
        confirmedBy: parcels.confirmedBy,
      })
      .from(parcels)
      .where(
        and(
          eq(parcels.id, input.parcelId),
          eq(parcels.companyId, input.companyId),
          eq(parcels.destinationId, input.branchId),
          eq(parcels.isDeleted, false),
        ),
      );
    if (!parcel) throw NotFound('Parcel not found at your branch');
    const office = parcel.status === ParcelStatus.DELIVERED_BY_OFFICE;
    const home = parcel.status === ParcelStatus.DELIVERED_AT_HOME;
    if (!office && !home)
      throw Conflict('Only a parcel with a current delivery confirmation can be reversed');

    const [delivery] = await tx
      .select({
        id: deliveries.id,
        status: deliveries.status,
        confirmedAt: deliveries.confirmedAt,
        riderCompletedAt: deliveries.riderCompletedAt,
        riderUserId: deliveries.riderUserId,
      })
      .from(deliveries)
      .where(and(eq(deliveries.parcelId, input.parcelId), eq(deliveries.isDeleted, false)));
    if (home && (!delivery || delivery.status !== 'DELIVERED_AT_HOME')) {
      throw Conflict('Home delivery confirmation is inconsistent and cannot be reversed');
    }
    if (office && delivery?.status === 'DELIVERED_AT_HOME') {
      throw Conflict('Delivery records do not match this office handover');
    }

    const restoredStatus = office
      ? ParcelStatus.AWAITING_PICKUP
      : ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER;
    const [updated] = await tx
      .update(parcels)
      .set({
        status: restoredStatus,
        ...(office ? { confirmedAt: null, confirmedBy: null } : {}),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(parcels.id, input.parcelId),
          eq(parcels.companyId, input.companyId),
          eq(parcels.destinationId, input.branchId),
          eq(parcels.status, parcel.status),
          eq(parcels.isDeleted, false),
          ...(parcel.confirmedAt
            ? [eq(parcels.confirmedAt, parcel.confirmedAt)]
            : [isNull(parcels.confirmedAt)]),
        ),
      )
      .returning({ id: parcels.id });
    if (!updated)
      throw Conflict('The parcel changed while reversing delivery; reload and try again');

    if (office) {
      const [activeQueue] = await tx
        .select({ id: pickupQueues.id })
        .from(pickupQueues)
        .where(and(eq(pickupQueues.parcelId, input.parcelId), isNull(pickupQueues.endedAt)))
        .limit(1);
      const [endedQueue] = await tx
        .select({ id: pickupQueues.id })
        .from(pickupQueues)
        .where(and(eq(pickupQueues.parcelId, input.parcelId), isNotNull(pickupQueues.endedAt)))
        .orderBy(desc(pickupQueues.endedAt))
        .limit(1);
      if (endedQueue && !activeQueue) {
        await tx
          .update(pickupQueues)
          .set({ endedAt: null, endedBy: null, updatedAt: new Date() })
          .where(eq(pickupQueues.id, endedQueue.id));
      }
    } else if (delivery) {
      const [restored] = await tx
        .update(deliveries)
        .set({
          status: 'RIDER_GIVEN_PARCEL_TO_CUSTOMER',
          deliveredAt: null,
          confirmedAt: delivery.riderCompletedAt,
          confirmedBy: delivery.riderUserId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(deliveries.id, delivery.id),
            eq(deliveries.status, 'DELIVERED_AT_HOME'),
            ...(delivery.confirmedAt
              ? [eq(deliveries.confirmedAt, delivery.confirmedAt)]
              : [isNull(deliveries.confirmedAt)]),
          ),
        )
        .returning({ id: deliveries.id });
      if (!restored) throw Conflict('The delivery changed while reversing; reload and try again');
    }
    return { ...parcel, restoredStatus };
  });

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'parcel',
    entityId: input.parcelId,
    action: 'PARCEL_DELIVERY_REVERSED',
    message: `Delivery confirmation reversed for ${previous.bookingCode}`,
    metadata: {
      reason,
      previousStatus: previous.status,
      restoredStatus: previous.restoredStatus,
      previousConfirmedAt: previous.confirmedAt?.toISOString(),
      previousConfirmedBy: previous.confirmedBy,
      branchId: input.branchId,
    },
  });
  return { id: input.parcelId, status: previous.restoredStatus };
}
