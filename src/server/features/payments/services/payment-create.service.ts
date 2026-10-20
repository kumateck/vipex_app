import { db } from '@/db/config';
import type { DbExecutor, PaymentCreateInput, PaymentCreateResponse } from '../types/payment.types';
import { debugPaymentServiceError } from '../utils/payment-diagnostics';
import { createPaymentCore, auditPaymentCreated } from './payment-core.service';

export async function createPaymentWithExecutorSvc(
  input: PaymentCreateInput,
  executor: DbExecutor,
): Promise<PaymentCreateResponse> {
  const result = await createPaymentCore(input, executor);
  if (result.kind === 'paymentCreated') {
    await auditPaymentCreated(input, result.response.id);
  }
  return result.response;
}

export async function createPaymentSvc(input: PaymentCreateInput): Promise<PaymentCreateResponse> {
  try {
    return await db.transaction((tx) => createPaymentWithExecutorSvc(input, tx));
  } catch (error) {
    debugPaymentServiceError('createPaymentSvc', input as Record<string, unknown>, error);
    throw error;
  }
}
