import { PaymentComponent, Payer, CashierType, PaymentMethod } from '@/db/schemas';
import { ParcelStatus } from '@/db/schemas/enums';
import { db } from '@/db/config';
import { recordAuditLog } from '../../audit/logger';
import { assertActiveSessionSvc } from '../../cashiers/service';
import {
  lockSenderProcessingParcelRepo,
  lockSenderProcessingSessionRepo,
} from '../sender-processing.repository';
import { updateParcelRepo } from '../../shipments/parcels.repository';
import type { PaymentCreateResponse } from '../types/payment.types';
import { debugPaymentServiceError } from '../utils/payment-diagnostics';
import { createPaymentCore, auditPaymentCreated } from './payment-core.service';

export async function collectSenderPaymentAndProcessSvc(input: {
  companyId: string;
  branchId: string;
  parcelId: string;
  method: PaymentMethod;
  cashierUserId: string;
  amountCedis?: number | string | null;
  momoTransactionId?: string | null;
}) {
  try {
    const hasAmount =
      input.amountCedis !== undefined &&
      input.amountCedis !== null &&
      Number(input.amountCedis) > 0;

    const result = await db.transaction(async (tx) => {
      const activeSession = await assertActiveSessionSvc({
        cashierId: input.cashierUserId,
        branchId: input.branchId,
        executor: tx,
      });
      await lockSenderProcessingSessionRepo(activeSession.id, input, tx);
      const parcel = await lockSenderProcessingParcelRepo(input, tx);

      let payment: PaymentCreateResponse | null = null;
      if (hasAmount) {
        const created = await createPaymentCore(
          {
            companyId: input.companyId,
            branchId: input.branchId,
            parcelId: input.parcelId,
            component: PaymentComponent.PRINCIPAL,
            payer: Payer.SENDER,
            cashierType: CashierType.SENDING,
            method: input.method,
            cashierUserId: input.cashierUserId,
            amountCedis: input.amountCedis as number | string,
            momoTransactionId: input.momoTransactionId ?? null,
          },
          tx,
        );
        payment = created.response;
      }

      let statusChanged = false;
      const patch: Partial<Parameters<typeof updateParcelRepo>[1]> = {};
      if (parcel.status === ParcelStatus.CREATED) {
        patch.status = ParcelStatus.PROCESSED;
        patch.processedBy = input.cashierUserId;
        patch.cashierSessionId = activeSession.id;
      }

      if (Object.keys(patch).length > 0) {
        const updated = await updateParcelRepo(input.parcelId, patch, tx);
        statusChanged = patch.status === ParcelStatus.PROCESSED && Boolean(updated);
      }

      return {
        payment,
        statusChanged,
        sessionId: activeSession.id,
        previousSessionId: parcel.cashierSessionId,
      };
    });

    if (result.payment && !result.payment.id.startsWith('auto-processed:')) {
      await auditPaymentCreated(
        {
          companyId: input.companyId,
          branchId: input.branchId,
          parcelId: input.parcelId,
          component: PaymentComponent.PRINCIPAL,
          payer: Payer.SENDER,
          cashierType: CashierType.SENDING,
          method: input.method,
          cashierUserId: input.cashierUserId,
          amountCedis: input.amountCedis as number | string,
        },
        result.payment.id,
      );
    }

    if (result.statusChanged) {
      await recordAuditLog({
        companyId: input.companyId,
        actorUserId: input.cashierUserId,
        entityType: 'parcel',
        entityId: input.parcelId,
        action: 'PARCEL_SENDER_PROCESSED',
        message: 'Cashier confirmed the sender transaction',
        metadata: {
          cashierSessionId: result.sessionId,
          previousSessionId: result.previousSessionId,
        },
      });
    }
    return {
      parcelId: input.parcelId,
      status: ParcelStatus.PROCESSED,
      statusChanged: result.statusChanged,
      payment: result.payment,
      message: result.payment?.message ?? 'Sender payment flow completed.',
    };
  } catch (error) {
    debugPaymentServiceError(
      'collectSenderPaymentAndProcessSvc',
      input as Record<string, unknown>,
      error,
    );
    throw error;
  }
}
