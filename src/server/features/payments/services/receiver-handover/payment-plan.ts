import { PaymentComponent } from '@/db/schemas';
import { BadRequest, Conflict } from '@/server/utils/http-error';
import { toPesewas } from '@/server/utils/gh-money';
import { assertActiveSessionSvc } from '../../../cashiers/service';
import { getParcelPaymentSettlement } from '../../../shipments/parcel-payment-settlement';
import { getParcelStorageSettlementSvc, getParcelSvc } from '../../../shipments/parcels.service';
import { assertParcelCanAccrueCharge } from '../../../shipments/charge-exemption';
import { assertCreditPrincipalNotCollected } from '../../utils';
import { listPaymentsForParcelRepo } from '../../repository';
import type { DbExecutor } from '../../types/payment.types';
import type { ReceiverPaymentInput } from '../../types/receiver-payment.types';
import type { ReceiverHandoverPaymentPlan } from '@/shared/shipments/pending-receiver-handover';

/** Quote the collection without creating a payment, tax posting, or reducing the balance. */
export async function prepareReceiverPaymentPlan(input: ReceiverPaymentInput, tx: DbExecutor) {
  await assertActiveSessionSvc({
    cashierId: input.cashierUserId,
    branchId: input.branchId,
    executor: tx,
  });
  const [parcel, settlement, storageAfter, existingPayments] = await Promise.all([
    getParcelSvc(input.parcelId, tx),
    getParcelPaymentSettlement(input.parcelId, tx),
    getParcelStorageSettlementSvc(input.parcelId, tx),
    listPaymentsForParcelRepo(input.parcelId, tx),
  ]);
  const principalCedis = Number(input.amountCedis ?? 0);
  const storageCedis = Number(input.storageAmountCedis ?? 0);
  if (![principalCedis, storageCedis].every((value) => Number.isFinite(value) && value >= 0)) {
    throw BadRequest('Payment amounts must be finite and non-negative');
  }
  const principalPsw = Number(toPesewas(principalCedis));
  const storagePsw = Number(toPesewas(storageCedis));
  if (![principalPsw, storagePsw].every((value) => Number.isSafeInteger(value) && value >= 0)) {
    throw BadRequest('Payment amounts exceed the supported range');
  }
  assertParcelCanAccrueCharge(parcel, principalPsw + storagePsw);
  if (principalPsw > 0)
    assertCreditPrincipalNotCollected(parcel.method, PaymentComponent.PRINCIPAL);
  if (
    principalPsw !== settlement.requiredPrincipalPsw - settlement.paidPrincipalPsw ||
    settlement.requiredDeliveryFeePsw !== settlement.paidDeliveryFeePsw ||
    storagePsw !== storageAfter.outstandingPsw
  ) {
    throw Conflict(
      'Payment or storage balance changed. Reopen Receiver Cashier and check the amount.',
    );
  }
  const paymentPlan: ReceiverHandoverPaymentPlan = {
    method: input.method,
    principalPsw,
    storagePsw,
    chargePsw: settlement.requiredPrincipalPsw,
    existingPaymentIds: existingPayments.map(({ id }) => id),
    momoTransactionId: input.momoTransactionId ?? null,
  };
  return {
    payment: null,
    storagePayment: null,
    receiptTaxBreakdown: null,
    storageAfter,
    paymentPlan,
  };
}
