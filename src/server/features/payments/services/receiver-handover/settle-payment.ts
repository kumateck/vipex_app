import { eq } from 'drizzle-orm';
import { auditLogs, parcels, CashierType, Payer, PaymentComponent } from '@/db/schemas';
import { Conflict } from '@/server/utils/http-error';
import type { PendingReceiverHandover } from '@/shared/shipments/pending-receiver-handover';
import type { DbExecutor } from '../../types/payment.types';
import { prepareReceiverPaymentPlan } from './payment-plan';
import { settleReceiverPayments } from '../settle-receiver-payments';

/** Called only after the signed parcel is locked and confirmation has passed its guards. */
export async function settlePendingReceiverPayments(
  parcelId: string,
  pending: PendingReceiverHandover,
  actorId: string,
  tx: DbExecutor,
) {
  const plan = pending.paymentPlan;
  // Historical requests already have real payments. Never collect those again.
  if (!plan) return pending.snapshot;
  const input = {
    companyId: pending.companyId,
    branchId: pending.branchId,
    parcelId,
    cashierUserId: actorId,
    confirmedBy: pending.associateId,
    method: plan.method,
    amountCedis: (plan.principalPsw / 100).toFixed(2),
    storageAmountCedis: (plan.storagePsw / 100).toFixed(2),
    momoTransactionId: plan.momoTransactionId,
  };
  const { paymentPlan: current } = await prepareReceiverPaymentPlan(input, tx);
  if (
    current.chargePsw !== plan.chargePsw ||
    current.existingPaymentIds.length !== plan.existingPaymentIds.length ||
    current.existingPaymentIds.some((id) => !plan.existingPaymentIds.includes(id))
  ) {
    throw Conflict('Payment records changed. Ask a supervisor to review the handover.');
  }
  // Keep the normal payment guard intact. The row stays locked; rollback restores
  // this pending request if settlement, tax posting, or final confirmation fails.
  await tx.update(parcels).set({ pendingReceiverHandover: null }).where(eq(parcels.id, parcelId));
  const { payment, storagePayment, receiptTaxBreakdown } = await settleReceiverPayments(input, tx);
  const posted = [
    { payment, component: PaymentComponent.PRINCIPAL },
    { payment: storagePayment, component: PaymentComponent.OTHER },
  ].filter(({ payment }) => payment && !payment.id.startsWith('auto-processed:'));
  if (posted.length) {
    await tx.insert(auditLogs).values(
      posted.map(({ payment, component }) => ({
        companyId: pending.companyId,
        actorUserId: actorId,
        entityType: 'payment',
        entityId: payment!.id,
        action: 'PAYMENT_CREATED',
        message: 'Payment captured at receiver handover confirmation',
        metadata: {
          parcelId,
          handoverId: pending.id,
          branchId: pending.branchId,
          component,
          payer: Payer.RECIPIENT,
          cashierType: CashierType.TOBEPAID,
          method: plan.method,
          amountCedis: payment!.amounts.grossCedis,
          paymentRequestedBy: pending.requestedBy,
        },
      })),
    );
  }
  return {
    ...pending.snapshot,
    paymentIds: posted.map(({ payment }) => payment!.id),
    ...(receiptTaxBreakdown ? { receiverCashierReceiptTax: receiptTaxBreakdown } : {}),
  };
}
