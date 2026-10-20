import { BadRequest } from '../../../utils/http-error';
import {
  PaymentComponent,
  Payer,
  CashierType,
  PaymentMethod,
  parcels,
  pickupQueues,
} from '@/db/schemas';
import { ParcelStatus } from '@/db/schemas/enums';
import { db } from '@/db/config';
import { and, eq, isNull } from 'drizzle-orm';
import { toPesewas } from '@/server/utils/gh-money';
import { getParcelStorageSettlementSvc, getParcelSvc } from '../../shipments/parcels.service';
import {
  assertNoOutstandingStorageForHandover,
  assertValidStorageCollectionAmount,
} from '../../shipments/storage-accrual-guards';
import { assertParcelFullyPaid } from '../../shipments/parcel-payment-settlement';
import { updateParcelRepo } from '../../shipments/parcels.repository';
import { assertNoOpenParcelReconciliationCaseForDelivery } from '../../shipments/parcel-delivery-reconciliation-guard';
import { endPickupQueueForParcelSvc } from '../../pickup-queues/service';
import { getBranchRepo } from '../../branches/repository';
import {
  assertReceiverOtpVerifiedSvc,
  consumeReceiverOtpTokenSvc,
} from '../../parcel-receiver-otp/service';
import type { PaymentCreateResponse } from '../types/payment.types';
import { debugPaymentServiceError } from '../utils/payment-diagnostics';
import { toPaymentAmounts, computeProfileTaxBreakdown } from '../utils/payment-tax';
import {
  STORAGE_PAYMENT_NOTE_PREFIX,
  createPaymentCore,
  auditPaymentCreated,
} from './payment-core.service';

export async function collectReceiverPaymentAndDeliverSvc(input: {
  companyId: string;
  branchId: string;
  parcelId: string;
  method: PaymentMethod;
  cashierUserId: string;
  confirmedBy: string;
  secondReceiverId?: string | null;
  cardId?: string | null;
  cardNumber?: string | null;
  secondCardId?: string | null;
  secondCardNumber?: string | null;
  amountCedis?: number | string | null;
  storageAmountCedis?: number | string | null;
  receiverOtpVerificationToken?: string;
  receiverOtpTarget?: 'main' | 'second';
  momoTransactionId?: string | null;
}) {
  try {
    const parcel = await getParcelSvc(input.parcelId);
    const destinationBranch = await getBranchRepo(parcel.destinationId);
    if (!destinationBranch) throw BadRequest('Destination branch not found');
    let verifiedOtp: Awaited<ReturnType<typeof assertReceiverOtpVerifiedSvc>> | null = null;
    if (destinationBranch.requireReceiverOtp) {
      if (!input.receiverOtpVerificationToken || !input.receiverOtpTarget) {
        throw BadRequest('Receiver OTP verification is required before handover');
      }
      verifiedOtp = await assertReceiverOtpVerifiedSvc({
        parcelId: input.parcelId,
        targetReceiver: input.receiverOtpTarget,
        verificationToken: input.receiverOtpVerificationToken,
      });
    }

    const hasAmount =
      input.amountCedis !== undefined &&
      input.amountCedis !== null &&
      Number(input.amountCedis) > 0;
    const hasStorageAmount =
      input.storageAmountCedis !== undefined &&
      input.storageAmountCedis !== null &&
      Number(input.storageAmountCedis) > 0;

    const result = await db.transaction(async (tx) => {
      const [beforeDelivery] = await tx
        .select({
          status: parcels.status,
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
        beforeDelivery.companyId !== input.companyId ||
        beforeDelivery.destinationId !== input.branchId
      ) {
        throw BadRequest('Parcel is not at this destination branch');
      }
      if (
        beforeDelivery.status === ParcelStatus.DELIVERED_BY_OFFICE ||
        beforeDelivery.status === ParcelStatus.DELIVERED_AT_HOME
      ) {
        throw BadRequest('Parcel is already delivered');
      }
      const [activeQueue] = await tx
        .select({ id: pickupQueues.id })
        .from(pickupQueues)
        .where(and(eq(pickupQueues.parcelId, input.parcelId), isNull(pickupQueues.endedAt)))
        .limit(1);
      await assertNoOpenParcelReconciliationCaseForDelivery(input.parcelId, tx);
      let payment: PaymentCreateResponse | null = null;
      let storagePayment: PaymentCreateResponse | null = null;
      if (hasAmount) {
        const created = await createPaymentCore(
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
            momoTransactionId: input.momoTransactionId ?? null,
          },
          tx,
        );
        payment = created.response;
      }

      const storageBefore = await getParcelStorageSettlementSvc(input.parcelId, tx);
      const storageAmountPsw = hasStorageAmount
        ? Number(toPesewas(input.storageAmountCedis as number | string))
        : 0;
      if (hasStorageAmount) {
        assertValidStorageCollectionAmount({
          outstandingPsw: storageBefore.outstandingPsw,
          collectionPsw: storageAmountPsw,
        });
      }
      if (hasStorageAmount) {
        const storagePaymentResult = await createPaymentCore(
          {
            companyId: input.companyId,
            branchId: input.branchId,
            parcelId: input.parcelId,
            component: PaymentComponent.OTHER,
            payer: Payer.RECIPIENT,
            cashierType: CashierType.TOBEPAID,
            method: input.method,
            cashierUserId: input.cashierUserId,
            amountCedis: input.storageAmountCedis as number | string,
            notes: `${STORAGE_PAYMENT_NOTE_PREFIX}: Receiver storage accrual payment`,
          },
          tx,
        );
        storagePayment = storagePaymentResult.response;
      }

      const storageAfter = await getParcelStorageSettlementSvc(input.parcelId, tx);
      assertNoOutstandingStorageForHandover(storageAfter.outstandingPsw);

      await assertParcelFullyPaid(input.parcelId, tx);
      await updateParcelRepo(
        input.parcelId,
        {
          status: ParcelStatus.DELIVERED_BY_OFFICE,
          deliveryConfirmationSnapshot: {
            parcelStatus: beforeDelivery.status,
            confirmedAt: beforeDelivery.confirmedAt?.toISOString() ?? null,
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
          },
          confirmedBy: input.confirmedBy,
          confirmedAt: new Date(),
          secondReceiverId: input.secondReceiverId ?? null,
          cardId: input.cardId ?? null,
          cardNumber: input.cardNumber ?? null,
          secondCardId: input.secondCardId ?? null,
          secondCardNumber: input.secondCardNumber ?? null,
        },
        tx,
      );
      await endPickupQueueForParcelSvc(
        { parcelId: input.parcelId, endedBy: input.cashierUserId },
        tx,
      );

      const receiptTaxBreakdown = storagePayment
        ? toPaymentAmounts(
            await computeProfileTaxBreakdown({
              companyId: input.companyId,
              principalPsw: BigInt(
                (payment?.amounts.grossPsw ?? 0) + storagePayment.amounts.grossPsw,
              ),
              executor: tx,
            }),
          )
        : null;
      return { payment, storagePayment, storageBefore, storageAfter, receiptTaxBreakdown };
    });

    if (verifiedOtp) await consumeReceiverOtpTokenSvc(verifiedOtp.id);

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
      status: ParcelStatus.DELIVERED_BY_OFFICE,
      payment: result.payment,
      storagePayment: result.storagePayment,
      receiptTaxBreakdown: result.receiptTaxBreakdown,
      storageSettlement: result.storageAfter,
      message: 'Receiver cashier flow completed.',
    };
  } catch (error) {
    debugPaymentServiceError(
      'collectReceiverPaymentAndDeliverSvc',
      input as Record<string, unknown>,
      error,
    );
    throw error;
  }
}
