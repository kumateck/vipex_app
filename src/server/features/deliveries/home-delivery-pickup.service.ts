import { and, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, deliveries, parcels, users } from '@/db/schemas';
import { ParcelStatus, UserStatus, UserType } from '@/db/schemas/enums';
import { Forbidden } from '@/server/utils/http-error';
import { getParcelRepo, updateParcelRepo } from '../shipments/parcels.repository';
import { assertHomeDeliveryReadyForPickup } from './home-delivery-pickup.rules';

export async function returnHomeDeliveryToPickupSvc(input: {
  parcelId: string;
  companyId: string;
  branchId: string;
  actorUserId: string;
  permissions: readonly string[];
  expectedStatus?: number;
}) {
  return db.transaction(async (tx) => {
    const [actor] = await tx
      .select({ userType: users.userType })
      .from(users)
      .where(
        and(
          eq(users.id, input.actorUserId),
          eq(users.companyId, input.companyId),
          eq(users.branchId, input.branchId),
          eq(users.status, UserStatus.ACTIVE),
        ),
      );
    if (!actor || actor.userType === UserType.RIDER)
      throw Forbidden('Only active branch staff can return a home delivery to pickup');
    await tx
      .select({ id: parcels.id })
      .from(parcels)
      .where(eq(parcels.id, input.parcelId))
      .for('update');
    const [parcel, [delivery]] = await Promise.all([
      getParcelRepo(input.parcelId, tx),
      tx.select().from(deliveries).where(eq(deliveries.parcelId, input.parcelId)).for('update'),
    ]);
    const eligibleParcel = assertHomeDeliveryReadyForPickup({
      ...input,
      parcel,
      delivery: delivery ?? null,
    });
    const updatedAt = new Date();
    await updateParcelRepo(
      input.parcelId,
      {
        status: ParcelStatus.AWAITING_PICKUP,
        confirmedBy: null,
        confirmedAt: null,
      },
      tx,
    );
    if (delivery) {
      await tx
        .update(deliveries)
        .set({
          status: 'RETURNED_TO_OFFICE',
          chargePsw: 0,
          returnedAt: delivery.returnedAt ?? updatedAt,
          riderCompletedAt: null,
          confirmedBy: null,
          confirmedAt: null,
          signatureImage: null,
          riderCollectedPrincipalPsw: 0,
          riderCollectedDeliveryFeePsw: 0,
          riderCollectionRecordedAt: null,
          updatedAt,
        })
        .where(eq(deliveries.id, delivery.id));
    }
    // Preserve the mistaken handover and declared collections as evidence, atomically.
    await tx.insert(auditLogs).values({
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      entityType: 'parcel',
      entityId: input.parcelId,
      action: 'PARCEL_UPDATED',
      message: `Home delivery ${eligibleParcel.trackingCode} returned to office for pickup`,
      metadata: {
        patch: {
          status: ParcelStatus.AWAITING_PICKUP,
          confirmedBy: null,
          confirmedAt: null,
          deliveryChargePsw: 0,
        },
        previous: {
          status: eligibleParcel.status,
          confirmedBy: eligibleParcel.confirmedBy,
          confirmedAt: eligibleParcel.confirmedAt,
          delivery: delivery ?? null,
        },
      },
    });
    return { id: input.parcelId };
  });
}
