import { Conflict, NotFound } from '../../utils/http-error';
import { parcels, ParcelStatus } from '@/db/schemas';
import { db } from '@/db/config';
import { recordAuditLog } from '@/server/features/audit/logger';
import { eq } from 'drizzle-orm';
import { getParcelRepo, updateParcelRepo } from '../shipments/parcels.repository';
import { getDeliveryByParcelRepo, updateDeliveryRepo } from './repository';

export async function doorToDoorReturnToOfficeSvc(input: {
  parcelId: string;
  riderUserId: string;
}) {
  const result = await db.transaction(async (tx) => {
    await tx
      .select({ id: parcels.id })
      .from(parcels)
      .where(eq(parcels.id, input.parcelId))
      .for('update');
    const parcel = await getParcelRepo(input.parcelId, tx);
    if (!parcel) throw NotFound('Parcel not found');
    if (parcel.status !== ParcelStatus.DISPATCHED) {
      throw Conflict('Only dispatched parcels can be returned');
    }
    const delivery = await getDeliveryByParcelRepo(input.parcelId, tx);
    if (!delivery) throw NotFound('Delivery not found');
    if (delivery.riderUserId !== input.riderUserId) {
      throw Conflict('Parcel is not assigned to this rider');
    }
    const returnedAt = new Date();
    await updateParcelRepo(input.parcelId, { status: ParcelStatus.RETURNED_TO_OFFICE }, tx);
    await updateDeliveryRepo(
      delivery.id,
      {
        status: 'RETURNED_TO_OFFICE',
        // Keep the agreed fee for redispatch and delivery cashier settlement.
        returnedAt,
        updatedAt: returnedAt,
      },
      tx,
    );
    return { id: delivery.id, companyId: parcel.companyId, trackingCode: parcel.trackingCode };
  });
  await recordAuditLog({
    companyId: result.companyId,
    actorUserId: input.riderUserId,
    entityType: 'parcel',
    entityId: input.parcelId,
    action: 'PARCEL_UPDATED',
    message: `Rider returned parcel ${result.trackingCode} to office`,
    metadata: {
      patch: { status: ParcelStatus.RETURNED_TO_OFFICE },
      previous: { status: ParcelStatus.DISPATCHED },
    },
  });
  return { id: result.id };
}
