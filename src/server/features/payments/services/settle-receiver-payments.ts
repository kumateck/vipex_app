import { CashierType, Payer, PaymentComponent } from '@/db/schemas';
import { toPesewas } from '@/server/utils/gh-money';
import { getParcelStorageSettlementSvc } from '../../shipments/parcels.service';
import {
  assertNoOutstandingStorageForHandover,
  assertValidStorageCollectionAmount,
} from '../../shipments/storage-accrual-guards';
import { assertParcelFullyPaid } from '../../shipments/parcel-payment-settlement';
import type { ReceiverPaymentInput } from '../types/receiver-payment.types';
import type { DbExecutor } from '../types/payment.types';
import { computeProfileTaxBreakdown, toPaymentAmounts } from '../utils/payment-tax';
import { createPaymentCore, STORAGE_PAYMENT_NOTE_PREFIX } from './payment-core.service';

export async function settleReceiverPayments(input: ReceiverPaymentInput, tx: DbExecutor) {
  const common = {
    companyId: input.companyId,
    branchId: input.branchId,
    parcelId: input.parcelId,
    payer: Payer.RECIPIENT,
    cashierType: CashierType.TOBEPAID,
    method: input.method,
    cashierUserId: input.cashierUserId,
  };
  const amountCedis = input.amountCedis;
  const storageAmountCedis = input.storageAmountCedis;
  const payment =
    amountCedis != null && Number(amountCedis) > 0
      ? (
          await createPaymentCore(
            {
              ...common,
              component: PaymentComponent.PRINCIPAL,
              amountCedis,
              momoTransactionId: input.momoTransactionId ?? null,
            },
            tx,
          )
        ).response
      : null;

  let storagePayment = null;
  if (storageAmountCedis != null && Number(storageAmountCedis) > 0) {
    const storageBefore = await getParcelStorageSettlementSvc(input.parcelId, tx);
    assertValidStorageCollectionAmount({
      outstandingPsw: storageBefore.outstandingPsw,
      collectionPsw: Number(toPesewas(storageAmountCedis)),
    });
    storagePayment = (
      await createPaymentCore(
        {
          ...common,
          component: PaymentComponent.OTHER,
          amountCedis: storageAmountCedis,
          notes: `${STORAGE_PAYMENT_NOTE_PREFIX}: Receiver storage accrual payment`,
        },
        tx,
      )
    ).response;
  }

  const storageAfter = await getParcelStorageSettlementSvc(input.parcelId, tx);
  assertNoOutstandingStorageForHandover(storageAfter.outstandingPsw);
  await assertParcelFullyPaid(input.parcelId, tx);
  const receiptTaxBreakdown = storagePayment
    ? toPaymentAmounts(
        await computeProfileTaxBreakdown({
          companyId: input.companyId,
          principalPsw: BigInt((payment?.amounts.grossPsw ?? 0) + storagePayment.amounts.grossPsw),
          executor: tx,
        }),
      )
    : null;
  return { payment, storagePayment, storageAfter, receiptTaxBreakdown };
}
