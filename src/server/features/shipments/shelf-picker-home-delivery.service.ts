import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcels, ParcelStatus } from '@/db/schemas';
import { Conflict, NotFound } from '../../utils/http-error';
import { recordAuditLog } from '../audit/logger';
import { endPickupQueueForParcelSvc } from '../pickup-queues/service';

export function assertShelfPickerHomeDeliveryCandidate(
  parcel: { status: number } | null | undefined,
): asserts parcel is { status: number } {
  if (!parcel) throw NotFound('Parcel not found at your branch');
  if (parcel.status !== ParcelStatus.AWAITING_PICKUP) {
    throw Conflict('Only parcels awaiting pickup can be moved to home delivery');
  }
}

export async function requestShelfPickerHomeDeliverySvc(input: {
  parcelId: string;
  companyId: string;
  branchId: string;
  actorUserId: string;
}) {
  const bookingCode = await db.transaction(async (tx) => {
    const [parcel] = await tx
      .select({ status: parcels.status, bookingCode: parcels.bookingCode })
      .from(parcels)
      .where(
        and(
          eq(parcels.id, input.parcelId),
          eq(parcels.companyId, input.companyId),
          eq(parcels.destinationId, input.branchId),
          eq(parcels.isDeleted, false),
        ),
      );
    assertShelfPickerHomeDeliveryCandidate(parcel);

    const [updated] = await tx
      .update(parcels)
      .set({ status: ParcelStatus.HOME_DELIVERY_REQUESTED, updatedAt: new Date() })
      .where(
        and(
          eq(parcels.id, input.parcelId),
          eq(parcels.companyId, input.companyId),
          eq(parcels.destinationId, input.branchId),
          eq(parcels.status, ParcelStatus.AWAITING_PICKUP),
          eq(parcels.isDeleted, false),
          isNull(parcels.confirmedAt),
        ),
      )
      .returning({ id: parcels.id });
    if (!updated) throw Conflict('Parcel changed while requesting delivery; reload and try again');
    await endPickupQueueForParcelSvc({ parcelId: input.parcelId, endedBy: input.actorUserId }, tx);
    return parcel.bookingCode;
  });

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'parcel',
    entityId: input.parcelId,
    action: 'PARCEL_HOME_DELIVERY_REQUESTED',
    message: `Home delivery requested for ${bookingCode} from Shelf Picker Update`,
    metadata: { previousStatus: ParcelStatus.AWAITING_PICKUP },
  });
  return { id: input.parcelId, status: ParcelStatus.HOME_DELIVERY_REQUESTED };
}
