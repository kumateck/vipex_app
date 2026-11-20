import { db } from '@/db/config';
import { CashierType, ParcelStatus, Payer, PaymentComponent } from '@/db/schemas';
import { signalReceiverHandoverChange } from './receiver-handover-changes';
import type { ReceiverPaymentInput } from '../types/receiver-payment.types';
import { debugPaymentServiceError } from '../utils/payment-diagnostics';
import { auditPaymentCreated } from './payment-core.service';
import { processReceiverPayment } from './process-receiver-payment';

export async function collectReceiverPaymentAndDeliverSvc(input: ReceiverPaymentInput) {
  try {
    const result = await db.transaction((tx) => processReceiverPayment(input, tx));
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
        ? 'Handover prepared. Payment will be recorded when receipt is confirmed.'
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
