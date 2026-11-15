import { and, eq } from 'drizzle-orm';
import { auditLogs, CashierType, ParcelStatus, Payer, PaymentComponent, users } from '@/db/schemas';
import type { PaymentMethod } from '@/db/schemas/enums';
import type { ReceiverCashierSignature } from '@/shared/shipments/receiver-cashier-signature';
import { BadRequest, Conflict } from '@/server/utils/http-error';
import type { DbExecutor } from '../shipments/parcel-repositories/parcel-repository.types';
import { processReceiverPayment } from '../payments/services/process-receiver-payment';
import { confirmOfficePickupInTransaction } from '../shipments/parcel-services/confirm-office-pickup';
import { checkBatchQuote } from './eligibility';
import { batchStaffScope, type BatchActor, type getBatchMembers } from './selection';

type BatchCapture = { id: string; signature: ReceiverCashierSignature; capturedAt: string };

export async function completeBatchParcel(
  actor: BatchActor,
  member: Awaited<ReturnType<typeof getBatchMembers>>[number],
  {
    method,
    associateId,
    usePickupQueue,
    batch,
  }: {
    method: PaymentMethod | undefined;
    associateId: string | undefined;
    usePickupQueue: boolean;
    batch: BatchCapture;
  },
  tx: DbExecutor,
) {
  const { parcel } = member;
  const current = await checkBatchQuote(actor, member, usePickupQueue, tx);
  const confirmedBy = current.associate ?? associateId;
  if (!confirmedBy) throw BadRequest('Select a parcel associate for unassigned parcels');
  if (!current.associate) {
    const [staff] = await tx
      .select({ id: users.id })
      .from(users)
      .where(and(batchStaffScope(actor), eq(users.id, confirmedBy)))
      .for('share');
    if (!staff) throw Conflict('The selected parcel associate is no longer available');
  }
  const handover = {
    companyId: actor.companyId,
    branchId: actor.branchId,
    parcelId: parcel.id,
    confirmedBy,
    handoverTarget: 'main' as const,
    cardId: parcel.cardId,
    cardNumber: parcel.cardNumber,
  };
  if (method !== undefined) {
    const { payment, storagePayment } = await processReceiverPayment(
      {
        ...handover,
        method,
        cashierUserId: actor.actorId,
        expectedReceiverId: parcel.receiverId,
        amountCedis: (current.principalPsw / 100).toFixed(2),
        storageAmountCedis: (current.storagePsw / 100).toFixed(2),
      },
      tx,
      batch,
    );
    const paymentAudits = [
      { payment, component: PaymentComponent.PRINCIPAL },
      { payment: storagePayment, component: PaymentComponent.OTHER },
    ].flatMap(({ payment, component }) =>
      payment && !payment.id.startsWith('auto-processed:')
        ? [
            {
              companyId: actor.companyId,
              actorUserId: actor.actorId,
              entityType: 'payment',
              entityId: payment.id,
              action: 'PAYMENT_CREATED',
              message: 'Payment captured',
              metadata: {
                batchHandoverId: batch.id,
                parcelId: parcel.id,
                branchId: actor.branchId,
                component,
                payer: Payer.RECIPIENT,
                cashierType: CashierType.TOBEPAID,
                method,
                amountCedis: (payment.amounts.grossPsw / 100).toFixed(2),
              },
            },
          ]
        : [],
    );
    if (paymentAudits.length) await tx.insert(auditLogs).values(paymentAudits);
  } else {
    await confirmOfficePickupInTransaction(
      {
        ...handover,
        locationId: actor.locationId,
        actorUserId: actor.actorId,
        signatureImage: batch.signature.signatureImage,
        expectedMainReceiverId: parcel.receiverId,
        expectedSecondReceiverId: parcel.secondReceiverId,
        secondReceiverId: parcel.secondReceiverId,
        secondCardId: parcel.secondCardId,
        secondCardNumber: parcel.secondCardNumber,
      },
      tx,
      batch.id,
    );
  }

  await tx.insert(auditLogs).values({
    companyId: actor.companyId,
    actorUserId: actor.actorId,
    entityType: 'parcel',
    entityId: parcel.id,
    action: 'PARCEL_UPDATED',
    message: 'Signed batch handover confirmed',
    metadata: {
      batchHandoverId: batch.id,
      workflow: actor.workflow,
      patch: { status: ParcelStatus.DELIVERED_BY_OFFICE },
      previous: { status: ParcelStatus.AWAITING_PICKUP },
      signatureCaptured: true,
      handoverTarget: 'main',
      customerId: parcel.receiverId,
      capturedAt: batch.capturedAt,
      source: batch.signature.source,
      otpVerified: true,
    },
  });
}
