import { NotFound } from '../../utils/http-error';
import {
  PaymentComponent,
  Payer,
  CashierType,
  PaymentMethod,
  CustomerCreditSourceType,
} from '@/db/schemas';
import { db } from '@/db/config';
import { createPaymentWithExecutorSvc } from '../payments/service';
import { getParcelRepo } from '../shipments/parcels.repository';
import { assertParcelFullyPaid } from '../shipments/parcel-payment-settlement';
import { getDeliveryByParcelRepo, updateDeliveryRepo } from './repository';
import { toPesewas } from '@/server/utils/gh-money';
import { postCustomerCreditChargeSvc } from '../customers/service';
import { assertNoOpenParcelReconciliationCaseForDelivery } from '../shipments/parcel-delivery-reconciliation-guard';

export async function doorToDoorCompleteSvc(input: {
  parcelId: string;
  cashierUserId: string;
  branchId: string;
  companyId: string;
  // Optional collections at doorstep:
  principalAmountCedis?: number | string | null; // to-be-paid principal (taxable)
  deliveryFeeAmountCedis?: number | string | null; // delivery fee (non-taxable)
  method: PaymentMethod;
}) {
  return db.transaction(async (tx) => {
    const parcel = await getParcelRepo(input.parcelId, tx);
    if (!parcel) throw NotFound('Parcel not found');
    await assertNoOpenParcelReconciliationCaseForDelivery(input.parcelId, tx);

    if (input.principalAmountCedis && Number(input.principalAmountCedis) > 0) {
      if (input.method === PaymentMethod.CREDIT) {
        await postCustomerCreditChargeSvc({
          customerId: parcel.receiverId,
          companyId: input.companyId,
          amountPsw: Number(toPesewas(input.principalAmountCedis)),
          sourceType: CustomerCreditSourceType.DELIVERY,
          referenceId: input.parcelId,
          notes: 'Delivery principal posted on customer credit',
          createdBy: input.cashierUserId,
          executor: tx,
        });
      } else {
        await createPaymentWithExecutorSvc(
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
      }
    }

    if (input.deliveryFeeAmountCedis && Number(input.deliveryFeeAmountCedis) > 0) {
      if (input.method === PaymentMethod.CREDIT) {
        await postCustomerCreditChargeSvc({
          customerId: parcel.receiverId,
          companyId: input.companyId,
          amountPsw: Number(toPesewas(input.deliveryFeeAmountCedis)),
          sourceType: CustomerCreditSourceType.DELIVERY,
          referenceId: input.parcelId,
          notes: 'Delivery fee posted on customer credit',
          createdBy: input.cashierUserId,
          executor: tx,
        });
      } else {
        await createPaymentWithExecutorSvc(
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
      }
    }

    const delivery = await getDeliveryByParcelRepo(input.parcelId, tx);
    if (!delivery) throw NotFound('Delivery not found');

    await assertParcelFullyPaid(input.parcelId, tx);

    const updated = await updateDeliveryRepo(
      delivery.id,
      {
        status: 'DELIVERED',
        deliveredAt: new Date(),
      },
      tx,
    );
    if (!updated) throw NotFound('Delivery not found');
    return { id: updated.id };
  });
}
