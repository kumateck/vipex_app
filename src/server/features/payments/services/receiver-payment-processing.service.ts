import { BadRequest, Conflict } from '../../../utils/http-error';
import {
  PaymentComponent,
  Payer,
  CashierType,
  parcels,
  pickupQueues,
  branches,
} from '@/db/schemas';
import { ParcelStatus } from '@/db/schemas/enums';
import { db } from '@/db/config';
import { and, eq, isNull } from 'drizzle-orm';
import { updateParcelRepo } from '../../shipments/parcels.repository';
import { assertNoOpenParcelReconciliationCaseForDelivery } from '../../shipments/parcel-delivery-reconciliation-guard';
import { endPickupQueueForParcelSvc } from '../../pickup-queues/service';
import { getPickupQueueDate } from '../../pickup-queues/queue-date';
import {
  assertReceiverOtpVerifiedSvc,
  consumeReceiverOtpTokenSvc,
} from '../../parcel-receiver-otp/service';
import type { DeliveryConfirmationSnapshot } from '@/shared/shipments/delivery-confirmation-snapshot';
import { signalReceiverHandoverChange } from './receiver-handover-changes';
import { prepareReceiverHandover } from './prepare-receiver-handover';
import type { ReceiverPaymentInput } from '../types/receiver-payment.types';
import { settleReceiverPayments } from './settle-receiver-payments';
import { debugPaymentServiceError } from '../utils/payment-diagnostics';
import { auditPaymentCreated } from './payment-core.service';

export async function collectReceiverPaymentAndDeliverSvc(input: ReceiverPaymentInput) {
  try {
    const result = await db.transaction(async (tx) => {
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
      const pendingSignature = destinationBranch.requireReceiverCashierSignature;
      if (pendingSignature !== Boolean(input.requestSignature)) {
        throw Conflict('Branch signature settings changed. Reopen Receiver Cashier and try again.');
      }
      if (
        pendingSignature &&
        (!input.handoverTarget ||
          !(Number(input.amountCedis) > 0 || Number(input.storageAmountCedis) > 0))
      ) {
        throw BadRequest(
          'Select the collector and enter the receiver payment before requesting a signature',
        );
      }
      if (
        pendingSignature &&
        (input.expectedReceiverId !== beforeDelivery.receiverId ||
          (input.handoverTarget === 'second' &&
            input.expectedSecondReceiverId !== beforeDelivery.secondReceiverId))
      )
        throw Conflict('The receiver changed. Reopen the parcel before processing payment.');
      if (destinationBranch.requireReceiverOtp) {
        if (
          !input.receiverOtpVerificationToken ||
          !input.receiverOtpTarget ||
          (pendingSignature && input.receiverOtpTarget !== 'main')
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
        ...(pendingSignature && receiptTaxBreakdown
          ? { receiverCashierReceiptTax: receiptTaxBreakdown }
          : {}),
      };
      const handoverFields = {
        secondReceiverId:
          pendingSignature && input.handoverTarget === 'main'
            ? beforeDelivery.secondReceiverId
            : (input.secondReceiverId ?? null),
        cardId: input.cardId ?? null,
        cardNumber: input.cardNumber ?? null,
        secondCardId:
          pendingSignature && input.handoverTarget === 'main'
            ? beforeDelivery.secondCardId
            : (input.secondCardId ?? null),
        secondCardNumber:
          pendingSignature && input.handoverTarget === 'main'
            ? beforeDelivery.secondCardNumber
            : (input.secondCardNumber ?? null),
      };
      const pending = pendingSignature
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
              otpVerified: destinationBranch.requireReceiverOtp,
              snapshot,
            },
            tx,
          )
        : null;
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

      return { payment, storagePayment, storageAfter, receiptTaxBreakdown, pending };
    });

    if (result.pending) signalReceiverHandoverChange(input);
    if (result.payment && !result.payment.id.startsWith('auto-processed:')) {
      await auditPaymentCreated(
        {
          companyId: input.companyId,
          branchId: input.branchId,
          parcelId: input.parcelId,
          component: PaymentComponent.PRINCIPAL,
          payer: Payer.RECIPIENT,
          cashierType: CashierType.TOBEPAID,
          method: input.method,
          cashierUserId: input.cashierUserId,
          amountCedis: input.amountCedis as number | string,
        },
        result.payment.id,
      );
    }

    return {
      parcelId: input.parcelId,
      status: result.pending ? ParcelStatus.AWAITING_PICKUP : ParcelStatus.DELIVERED_BY_OFFICE,
      awaitingSignature: Boolean(result.pending),
      handoverId: result.pending?.id,
      payment: result.payment,
      storagePayment: result.storagePayment,
      receiptTaxBreakdown: result.receiptTaxBreakdown,
      storageSettlement: result.storageAfter,
      message: result.pending
        ? 'Payment processed. Awaiting signature.'
        : 'Receiver cashier flow completed.',
    };
  } catch (error) {
    debugPaymentServiceError(
      'collectReceiverPaymentAndDeliverSvc',
      { parcelId: input.parcelId, companyId: input.companyId, branchId: input.branchId },
      error,
    );
    throw error;
  }
}
