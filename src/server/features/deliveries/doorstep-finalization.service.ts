import { Conflict, NotFound } from '../../utils/http-error';
import {
  PaymentComponent,
  Payer,
  CashierType,
  PaymentMethod,
  CustomerCreditSourceType,
  parcels,
} from '@/db/schemas';
import { db } from '@/db/config';
import { eq } from 'drizzle-orm';
import { createPaymentWithExecutorSvc } from '../payments/service';
import { ParcelStatus } from '@/db/schemas/enums';
import { getDeliveryByParcelRepo, updateDeliveryRepo } from './repository';
import { toPesewas } from '@/server/utils/gh-money';
import { updateParcelRepo } from '../shipments/parcels.repository';
import { postCustomerCreditChargeSvc } from '../customers/service';
import { assertNoOpenParcelReconciliationCaseForDelivery } from '../shipments/parcel-delivery-reconciliation-guard';

export async function doorToDoorFinalizeAtOfficeSvc(input: {
  parcelId: string;
  cashierUserId: string;
  branchId: string;
  companyId: string;
  principalAmountCedis?: number | string | null;
  deliveryFeeAmountCedis?: number | string | null;
  method: PaymentMethod;
}) {
  return db.transaction(async (tx) => {
    const [parcel] = await tx
      .select()
      .from(parcels)
      .where(eq(parcels.id, input.parcelId))
      .for('update');
    if (!parcel) throw NotFound('Parcel not found');
    if (parcel.status !== ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER) {
      throw Conflict('Parcel is not ready for delivery cashier finalization');
    }
    await assertNoOpenParcelReconciliationCaseForDelivery(input.parcelId, tx);
    const delivery = await getDeliveryByParcelRepo(input.parcelId, tx);
    if (!delivery) throw NotFound('Delivery not found');

    let collectedPsw = 0;
    const paymentIds: string[] = [];
    const creditChargeIds: string[] = [];
    if (input.principalAmountCedis && Number(input.principalAmountCedis) > 0) {
      if (input.method === PaymentMethod.CREDIT) {
        const amountPsw = Number(toPesewas(input.principalAmountCedis));
        const charge = await postCustomerCreditChargeSvc({
          customerId: parcel.receiverId,
          companyId: input.companyId,
          amountPsw,
          sourceType: CustomerCreditSourceType.DELIVERY,
          referenceId: input.parcelId,
          notes: 'Finalized delivery principal posted on customer credit',
          createdBy: input.cashierUserId,
          executor: tx,
        });
        creditChargeIds.push(charge.id);
        collectedPsw += amountPsw;
      } else {
        const payment = await createPaymentWithExecutorSvc(
          {
            companyId: input.companyId,
            branchId: input.branchId,
            parcelId: input.parcelId,
            component: PaymentComponent.PRINCIPAL,
            payer: Payer.RECIPIENT,
            cashierType: CashierType.DELIVERY,
            method: input.method,
            cashierUserId: input.cashierUserId,
            amountCedis: input.principalAmountCedis,
          },
          tx,
        );
        paymentIds.push(payment.id);
        collectedPsw += payment.amounts.grossPsw;
      }
    }

    if (input.deliveryFeeAmountCedis && Number(input.deliveryFeeAmountCedis) > 0) {
      if (input.method === PaymentMethod.CREDIT) {
        const amountPsw = Number(toPesewas(input.deliveryFeeAmountCedis));
        const charge = await postCustomerCreditChargeSvc({
          customerId: parcel.receiverId,
          companyId: input.companyId,
          amountPsw,
          sourceType: CustomerCreditSourceType.DELIVERY,
          referenceId: input.parcelId,
          notes: 'Finalized delivery fee posted on customer credit',
          createdBy: input.cashierUserId,
          executor: tx,
        });
        creditChargeIds.push(charge.id);
        collectedPsw += amountPsw;
      } else {
        const payment = await createPaymentWithExecutorSvc(
          {
            companyId: input.companyId,
            branchId: input.branchId,
            parcelId: input.parcelId,
            component: PaymentComponent.DELIVERY_FEE,
            payer: Payer.RECIPIENT,
            cashierType: CashierType.DELIVERY,
            method: input.method,
            cashierUserId: input.cashierUserId,
            amountCedis: input.deliveryFeeAmountCedis,
          },
          tx,
        );
        paymentIds.push(payment.id);
        collectedPsw += payment.amounts.grossPsw;
      }
    }

    await updateDeliveryRepo(
      delivery.id,
      {
        status: 'DELIVERED_AT_HOME',
        amountPaidPsw: Number(delivery.amountPaidPsw ?? 0) + collectedPsw,
        deliveredAt: new Date(),
        confirmedBy: input.cashierUserId,
        confirmedAt: new Date(),
        updatedAt: new Date(),
      },
      tx,
    );
    await updateParcelRepo(
      input.parcelId,
      {
        status: ParcelStatus.DELIVERED_AT_HOME,
        deliveryConfirmationSnapshot: {
          parcelStatus: parcel.status,
          confirmedAt: parcel.confirmedAt?.toISOString() ?? null,
          confirmedBy: parcel.confirmedBy,
          plannedToBePaidPsw: parcel.plannedToBePaidPsw,
          paymentIds,
          creditChargeIds,
          pickupQueueId: null,
          handover: {
            secondReceiverId: parcel.secondReceiverId,
            secondReceiverNameSnapshot: parcel.secondReceiverNameSnapshot,
            cardId: parcel.cardId,
            cardNumber: parcel.cardNumber,
            secondCardId: parcel.secondCardId,
            secondCardNumber: parcel.secondCardNumber,
          },
          delivery: {
            status: delivery.status,
            amountPaidPsw: delivery.amountPaidPsw,
            deliveredAt: delivery.deliveredAt?.toISOString() ?? null,
            confirmedAt: delivery.confirmedAt?.toISOString() ?? null,
            confirmedBy: delivery.confirmedBy,
          },
        },
      },
      tx,
    );
    return { id: delivery.id };
  });
}
