import { BadRequest, Conflict } from '../../../utils/http-error';
import { parcels, pickupQueues, branches } from '@/db/schemas';
import { ParcelStatus } from '@/db/schemas/enums';
import { and, eq, isNull } from 'drizzle-orm';
import { updateParcelRepo } from '../../shipments/parcels.repository';
import { assertNoOpenParcelReconciliationCaseForDelivery } from '../../shipments/parcel-delivery-reconciliation-guard';
import { endPickupQueueForParcelSvc } from '../../pickup-queues/service';
import { getPickupQueueDate } from '../../pickup-queues/queue-date';
import {
  assertReceiverOtpVerifiedSvc,
  consumeReceiverOtpTokenSvc,
} from '../../parcel-receiver-otp/service';
import {
  recordReceiverOtpException,
  resolveReceiverOtpException,
} from '../../parcel-receiver-otp/exception';
import type { DeliveryConfirmationSnapshot } from '@/shared/shipments/delivery-confirmation-snapshot';
import { prepareReceiverHandover } from './prepare-receiver-handover';
import type { ReceiverPaymentInput } from '../types/receiver-payment.types';
import { settleReceiverPayments } from './settle-receiver-payments';
import { validateExceptionCollector } from './validate-otp-exception-collector';
import type { DbExecutor } from '../types/payment.types';
import type { ReceiverCashierSignature } from '@/shared/shipments/receiver-cashier-signature';

type VerifiedBatch = { id: string; signature: ReceiverCashierSignature; capturedAt: string };

export async function processReceiverPayment(
  input: ReceiverPaymentInput,
  tx: DbExecutor,
  batch?: VerifiedBatch,
) {
  const [beforeDelivery] = await tx
    .select({
      status: parcels.status,
      isDeleted: parcels.isDeleted,
      receiverId: parcels.receiverId,
      pending: parcels.pendingReceiverHandover,
      companyId: parcels.companyId,
      destinationId: parcels.destinationId,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
      confirmedAt: parcels.confirmedAt,
      confirmedBy: parcels.confirmedBy,
      secondReceiverId: parcels.secondReceiverId,
      secondReceiverNameSnapshot: parcels.secondReceiverNameSnapshot,
      cardId: parcels.cardId,
      cardNumber: parcels.cardNumber,
      secondCardId: parcels.secondCardId,
      secondCardNumber: parcels.secondCardNumber,
    })
    .from(parcels)
    .where(eq(parcels.id, input.parcelId))
    .for('update');
  if (
    !beforeDelivery ||
    beforeDelivery.isDeleted ||
    beforeDelivery.companyId !== input.companyId ||
    beforeDelivery.destinationId !== input.branchId
  ) {
    throw BadRequest('Parcel is not at this destination branch');
  }
  if (beforeDelivery.pending) {
    throw Conflict('Payment is already processed. Open the parcel in Awaiting Signature.');
  }
  if (beforeDelivery.status !== ParcelStatus.AWAITING_PICKUP || beforeDelivery.confirmedAt) {
    throw Conflict('Parcel is no longer awaiting pickup');
  }
  const [destinationBranch] = await tx
    .select()
    .from(branches)
    .where(
      and(
        eq(branches.id, input.branchId),
        eq(branches.companyId, input.companyId),
        eq(branches.isDeleted, false),
      ),
    )
    .for('share');
  if (!destinationBranch) throw BadRequest('Destination branch not found');
  const needsSignature = Boolean(batch || destinationBranch.requireReceiverCashierSignature);
  const approvalScope = input.otpAuthorizationId
    ? await validateExceptionCollector(input, beforeDelivery, tx)
    : null;
  const approval = approvalScope
    ? await resolveReceiverOtpException(
        tx,
        input,
        destinationBranch.requireReceiverOtp,
        approvalScope,
      )
    : null;
  if (!batch && needsSignature !== Boolean(input.requestSignature)) {
    throw Conflict('Branch signature settings changed. Reopen Receiver Cashier and try again.');
  }
  if (
    needsSignature &&
    (!input.handoverTarget ||
      !(Number(input.amountCedis) > 0 || Number(input.storageAmountCedis) > 0))
  ) {
    throw BadRequest(
      'Select the collector and enter the receiver payment before requesting a signature',
    );
  }
  if (
    needsSignature &&
    (input.expectedReceiverId !== beforeDelivery.receiverId ||
      (input.handoverTarget === 'second' &&
        input.expectedSecondReceiverId !== beforeDelivery.secondReceiverId))
  )
    throw Conflict('The receiver changed. Reopen the parcel before processing payment.');
  if (destinationBranch.requireReceiverOtp && !approval && !batch) {
    if (
      !input.receiverOtpVerificationToken ||
      !input.receiverOtpTarget ||
      (needsSignature && input.receiverOtpTarget !== 'main')
    ) {
      throw BadRequest('Receiver OTP verification is required before handover');
    }
    const verifiedOtp = await assertReceiverOtpVerifiedSvc(
      {
        parcelId: input.parcelId,
        targetReceiver: input.receiverOtpTarget,
        verificationToken: input.receiverOtpVerificationToken,
      },
      tx,
    );
    await consumeReceiverOtpTokenSvc(verifiedOtp.id, tx);
  }
  const [activeQueue] = await tx
    .select({ id: pickupQueues.id })
    .from(pickupQueues)
    .where(
      and(
        eq(pickupQueues.parcelId, input.parcelId),
        eq(pickupQueues.branchId, input.branchId),
        eq(pickupQueues.queueDate, getPickupQueueDate()),
        isNull(pickupQueues.endedAt),
      ),
    )
    .limit(1);
  if (destinationBranch.usePickupQueue && !activeQueue) {
    throw Conflict('Create a pickup queue ticket before processing receiver payment');
  }
  await assertNoOpenParcelReconciliationCaseForDelivery(input.parcelId, tx);
  const { payment, storagePayment, storageAfter, receiptTaxBreakdown } =
    await settleReceiverPayments(input, tx);
  const snapshot: DeliveryConfirmationSnapshot = {
    parcelStatus: beforeDelivery.status,
    confirmedAt: null,
    confirmedBy: beforeDelivery.confirmedBy,
    plannedToBePaidPsw: beforeDelivery.plannedToBePaidPsw,
    paymentIds: [payment?.id, storagePayment?.id].filter(
      (id): id is string => typeof id === 'string' && !id.startsWith('auto-processed:'),
    ),
    creditChargeIds: [],
    pickupQueueId: activeQueue?.id ?? null,
    handover: {
      secondReceiverId: beforeDelivery.secondReceiverId,
      secondReceiverNameSnapshot: beforeDelivery.secondReceiverNameSnapshot,
      cardId: beforeDelivery.cardId,
      cardNumber: beforeDelivery.cardNumber,
      secondCardId: beforeDelivery.secondCardId,
      secondCardNumber: beforeDelivery.secondCardNumber,
    },
    delivery: null,
    ...(needsSignature && receiptTaxBreakdown
      ? { receiverCashierReceiptTax: receiptTaxBreakdown }
      : {}),
  };
  const handoverFields = {
    secondReceiverId:
      needsSignature && input.handoverTarget === 'main'
        ? beforeDelivery.secondReceiverId
        : (input.secondReceiverId ?? null),
    cardId: input.cardId ?? null,
    cardNumber: input.cardNumber ?? null,
    secondCardId:
      needsSignature && input.handoverTarget === 'main'
        ? beforeDelivery.secondCardId
        : (input.secondCardId ?? null),
    secondCardNumber:
      needsSignature && input.handoverTarget === 'main'
        ? beforeDelivery.secondCardNumber
        : (input.secondCardNumber ?? null),
  };
  const prepared = needsSignature
    ? await prepareReceiverHandover(
        {
          companyId: input.companyId,
          branchId: input.branchId,
          requestedBy: input.cashierUserId,
          associateId: input.confirmedBy,
          handoverTarget: input.handoverTarget ?? 'main',
          receiverId: beforeDelivery.receiverId,
          secondReceiverId: handoverFields.secondReceiverId,
          storageAccruedPsw: storageAfter.accruedPsw,
          otpVerified: Boolean(batch || (destinationBranch.requireReceiverOtp && !approval)),
          snapshot,
        },
        tx,
      )
    : null;
  const pending = batch ? null : prepared;
  if (batch && prepared) {
    snapshot.batchHandoverId = batch.id;
    snapshot.receiverCashierSignature = {
      ...batch.signature,
      handoverId: batch.id,
      collectorId: prepared.collectorId,
      collectorName: prepared.collectorName,
      handoverTarget: prepared.handoverTarget,
      capturedBy: input.cashierUserId,
      capturedAt: batch.capturedAt,
    };
  }
  await updateParcelRepo(
    input.parcelId,
    pending
      ? {
          ...handoverFields,
          pendingReceiverHandover: pending,
        }
      : {
          ...handoverFields,
          status: ParcelStatus.DELIVERED_BY_OFFICE,
          deliveryConfirmationSnapshot: snapshot,
          confirmedBy: input.confirmedBy,
          confirmedAt: new Date(),
        },
    tx,
  );
  if (!pending) {
    await endPickupQueueForParcelSvc(
      { parcelId: input.parcelId, endedBy: input.cashierUserId },
      tx,
    );
  }

  if (approvalScope && approval) {
    await recordReceiverOtpException(tx, approvalScope, input.cashierUserId, approval);
  }
  return { payment, storagePayment, storageAfter, receiptTaxBreakdown, pending };
}
