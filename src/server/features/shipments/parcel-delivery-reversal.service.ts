import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import { db } from '@/db/config';
import { deliveries, parcels, pickupQueues, ParcelStatus, Payer } from '@/db/schemas';
import { BadRequest, Conflict, NotFound } from '../../utils/http-error';
import { recordAuditLog } from '../audit/logger';
import { listAllPaymentsForParcelRepo, softVoidPaymentsByIdsRepo } from '../payments/repository';
import { reverseDeliveryCreditCharges } from './parcel-delivery-credit-reversal';
import {
  getRecipientPaymentIdsForDeliveryReversal,
  getRestoredToBePaidPsw,
} from './parcel-delivery-reversal.utils';

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
        chargePsw: parcels.chargePsw,
        plannedToBePaidPsw: parcels.plannedToBePaidPsw,
        deliveryConfirmationSnapshot: parcels.deliveryConfirmationSnapshot,
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
        amountPaidPsw: deliveries.amountPaidPsw,
      })
      .from(deliveries)
      .where(and(eq(deliveries.parcelId, input.parcelId), eq(deliveries.isDeleted, false)));
    if (home && (!delivery || delivery.status !== 'DELIVERED_AT_HOME')) {
      throw Conflict('Home delivery confirmation is inconsistent and cannot be reversed');
    }
    if (office && delivery?.status === 'DELIVERED_AT_HOME') {
      throw Conflict('Delivery records do not match this office handover');
    }

    const snapshot = parcel.deliveryConfirmationSnapshot;
    const restoredStatus =
      snapshot?.parcelStatus ??
      (office ? ParcelStatus.AWAITING_PICKUP : ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER);
    if (
      restoredStatus === ParcelStatus.DELIVERED_BY_OFFICE ||
      restoredStatus === ParcelStatus.DELIVERED_AT_HOME
    ) {
      throw Conflict('Stored pre-delivery status is invalid; review this parcel');
    }
    const [updated] = await tx
      .update(parcels)
      .set({
        status: restoredStatus,
        confirmedAt: snapshot
          ? snapshot.confirmedAt
            ? new Date(snapshot.confirmedAt)
            : null
          : office
            ? null
            : parcel.confirmedAt,
        confirmedBy: snapshot ? snapshot.confirmedBy : office ? null : parcel.confirmedBy,
        ...(snapshot
          ? {
              secondReceiverId: snapshot.handover.secondReceiverId,
              cardId: snapshot.handover.cardId,
              cardNumber: snapshot.handover.cardNumber,
              secondCardId: snapshot.handover.secondCardId,
              secondCardNumber: snapshot.handover.secondCardNumber,
            }
          : {}),
        deliveryConfirmationSnapshot: null,
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

    const paymentRows = await listAllPaymentsForParcelRepo(input.parcelId, tx);
    if (
      snapshot &&
      snapshot.paymentIds.some(
        (id) =>
          !paymentRows.some((payment) => payment.id === id && payment.payer === Payer.RECIPIENT),
      )
    ) {
      throw Conflict('Delivery payment record is missing; review before reversing');
    }
    const recipientPaymentIds = getRecipientPaymentIdsForDeliveryReversal(paymentRows, snapshot);
    const voidedPaymentCount = await softVoidPaymentsByIdsRepo(
      recipientPaymentIds,
      input.actorUserId,
      `Delivery confirmation reversed: ${reason}`,
      tx,
    );
    if (voidedPaymentCount !== recipientPaymentIds.length) {
      throw Conflict('Payments changed while reversing delivery; reload and try again');
    }
    const restoredToBePaidPsw = getRestoredToBePaidPsw(
      parcel.chargePsw,
      paymentRows,
      recipientPaymentIds,
    );
    await tx
      .update(parcels)
      .set({ plannedToBePaidPsw: restoredToBePaidPsw, updatedAt: new Date() })
      .where(eq(parcels.id, parcel.id));
    const reversedCreditChargeCount = snapshot
      ? await reverseDeliveryCreditCharges({
          chargeIds: snapshot.creditChargeIds,
          parcelId: parcel.id,
          companyId: input.companyId,
          actorUserId: input.actorUserId,
          reason,
          tx,
        })
      : 0;

    if (office) {
      if (snapshot?.pickupQueueId) {
        const [activeQueue] = await tx
          .select({ id: pickupQueues.id })
          .from(pickupQueues)
          .where(and(eq(pickupQueues.parcelId, parcel.id), isNull(pickupQueues.endedAt)))
          .limit(1);
        if (activeQueue && activeQueue.id !== snapshot.pickupQueueId) {
          throw Conflict('Another pickup ticket is active; review before reversing');
        }
        const [reopened] = await tx
          .update(pickupQueues)
          .set({ endedAt: null, endedBy: null, updatedAt: new Date() })
          .where(
            and(
              eq(pickupQueues.id, snapshot.pickupQueueId),
              eq(pickupQueues.parcelId, parcel.id),
              isNotNull(pickupQueues.endedAt),
            ),
          )
          .returning({ id: pickupQueues.id });
        if (!reopened && !activeQueue) {
          throw Conflict('Original pickup ticket is missing; review before reversing');
        }
      }
      if (!snapshot) {
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
      }
    }
    if (delivery && (home || snapshot?.delivery)) {
      const [restored] = await tx
        .update(deliveries)
        .set({
          status: snapshot?.delivery?.status ?? 'RIDER_GIVEN_PARCEL_TO_CUSTOMER',
          amountPaidPsw: snapshot?.delivery?.amountPaidPsw ?? delivery.amountPaidPsw,
          deliveredAt: snapshot?.delivery?.deliveredAt
            ? new Date(snapshot.delivery.deliveredAt)
            : null,
          confirmedAt: snapshot?.delivery
            ? snapshot.delivery.confirmedAt
              ? new Date(snapshot.delivery.confirmedAt)
              : null
            : delivery.riderCompletedAt,
          confirmedBy: snapshot?.delivery ? snapshot.delivery.confirmedBy : delivery.riderUserId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(deliveries.id, delivery.id),
            eq(deliveries.status, delivery.status),
            ...(delivery.confirmedAt
              ? [eq(deliveries.confirmedAt, delivery.confirmedAt)]
              : [isNull(deliveries.confirmedAt)]),
          ),
        )
        .returning({ id: deliveries.id });
      if (!restored) throw Conflict('The delivery changed while reversing; reload and try again');
    }
    return {
      ...parcel,
      restoredStatus,
      restoredToBePaidPsw,
      voidedPaymentCount,
      reversedCreditChargeCount,
    };
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
      voidedPaymentCount: previous.voidedPaymentCount,
      reversedCreditChargeCount: previous.reversedCreditChargeCount,
      previousToBePaidPsw: previous.plannedToBePaidPsw,
      restoredToBePaidPsw: previous.restoredToBePaidPsw,
      branchId: input.branchId,
    },
  });
  return {
    id: input.parcelId,
    status: previous.restoredStatus,
    voidedPaymentCount: previous.voidedPaymentCount,
    plannedToBePaidPsw: previous.restoredToBePaidPsw,
  };
}
