import { and, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, deliveries, parcels } from '@/db/schemas';
import { Conflict, NotFound } from '@/server/utils/http-error';
import type { CustomerCorrectionInput } from '@/shared/shipments/parcel-customer-correction';
import { buildCorrectionView, parcelColumns } from './repository';
import { correctionRestriction, normalizeCorrection } from './rules';
import { resolveCorrectionCustomer } from './customer-update';
import { invalidateParcelPickupCredentials } from './pickup-credentials';

export async function correctParcelCustomer(
  raw: CustomerCorrectionInput & { companyId: string; actorUserId: string },
) {
  const input = normalizeCorrection(raw);
  return db.transaction(async (tx) => {
    const [parcel] = await tx
      .select(parcelColumns)
      .from(parcels)
      .where(
        and(
          eq(parcels.id, input.parcelId),
          eq(parcels.companyId, input.companyId),
          eq(parcels.isDeleted, false),
        ),
      )
      .for('update');
    if (!parcel) throw NotFound('Parcel not found in your company');
    const restriction = correctionRestriction(parcel);
    if (restriction) throw Conflict(restriction);
    if (parcel.version !== input.expectedVersion)
      throw Conflict('Parcel changed; find it again before correcting');
    const deliveryRows = await tx
      .select({
        confirmedAt: deliveries.confirmedAt,
        deliveredAt: deliveries.deliveredAt,
        riderCompletedAt: deliveries.riderCompletedAt,
      })
      .from(deliveries)
      .where(and(eq(deliveries.parcelId, parcel.id), eq(deliveries.isDeleted, false)))
      .for('update');
    if (deliveryRows.some((row) => row.confirmedAt || row.deliveredAt || row.riderCompletedAt)) {
      throw Conflict('Delivery handover is already confirmed; this parcel cannot be corrected');
    }
    const ids = {
      sender: parcel.senderId,
      receiver: parcel.receiverId,
      secondReceiver: parcel.secondReceiverId,
    };
    const currentId = ids[input.party];
    if (!currentId) throw Conflict('This parcel has no customer in the selected role');
    const resolved = await resolveCorrectionCustomer(tx, input, currentId);
    const { customer } = resolved;
    if (input.party === 'secondReceiver' && customer.id === parcel.receiverId) {
      throw Conflict('The second receiver must be a different customer from the main receiver');
    }
    if (input.party !== 'sender') await invalidateParcelPickupCredentials(tx, parcel.id);
    const recordedName =
      input.mode === 'relink' || input.updateName
        ? customer.fullname
        : parcel[`${input.party}NameSnapshot`] || customer.fullname;
    const associations = {
      sender: { senderId: customer.id, senderNameSnapshot: recordedName },
      receiver: { receiverId: customer.id, receiverNameSnapshot: recordedName },
      secondReceiver: { secondReceiverId: customer.id, secondReceiverNameSnapshot: recordedName },
    };
    const clearsHandover = input.party !== 'sender';
    const [updated] = await tx
      .update(parcels)
      .set({
        ...associations[input.party],
        updatedAt: new Date(),
        ...(clearsHandover ? { pendingReceiverHandover: null } : {}),
        ...(input.party === 'receiver' && input.mode === 'relink'
          ? {
              secondReceiverId: null,
              secondReceiverNameSnapshot: null,
              cardId: null,
              cardNumber: null,
              secondCardId: null,
              secondCardNumber: null,
            }
          : {}),
        ...(input.party === 'secondReceiver' && input.mode === 'relink'
          ? { secondCardId: null, secondCardNumber: null }
          : {}),
      })
      .where(eq(parcels.id, parcel.id))
      .returning(parcelColumns);
    const savedNames = {
      sender: updated?.senderNameSnapshot,
      receiver: updated?.receiverNameSnapshot,
      secondReceiver: updated?.secondReceiverNameSnapshot,
    };
    if (!updated || savedNames[input.party] !== recordedName) {
      throw Conflict(
        'Parcel name correction could not be saved; apply the customer-correction migration',
      );
    }
    await tx.insert(auditLogs).values({
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      entityType: 'parcel',
      entityId: parcel.id,
      action: 'PARCEL_CUSTOMER_CORRECTED',
      message: `Parcel ${input.party} corrected for ${parcel.bookingCode}`,
      metadata: {
        party: input.party,
        mode: input.mode,
        reason: input.reason,
        previous: resolved.previous,
        customer,
        previousRecordedName: parcel[`${input.party}NameSnapshot`],
        affectedParcels: resolved.affectedParcels,
      },
    });
    return buildCorrectionView(updated, tx);
  });
}
