import { and, eq } from 'drizzle-orm';
import { customers } from '@/db/schemas';
import { BadRequest, Conflict } from '@/server/utils/http-error';
import type { DbExecutor } from '../../shipments/parcel-repositories/parcel-repository.types';
import type { ReceiverPaymentInput } from '../types/receiver-payment.types';

export async function validateExceptionCollector(
  input: ReceiverPaymentInput,
  parcel: { receiverId: string; secondReceiverId: string | null },
  tx: DbExecutor,
) {
  const handoverTarget = input.handoverTarget;
  if (!handoverTarget) throw BadRequest('Select the collector before using admin approval');
  if (
    input.expectedReceiverId !== parcel.receiverId ||
    (handoverTarget === 'second' && input.expectedSecondReceiverId !== parcel.secondReceiverId)
  )
    throw Conflict('The receiver changed. Reopen the parcel before using admin approval.');
  const collectorId = handoverTarget === 'main' ? parcel.receiverId : input.secondReceiverId;
  if (
    !collectorId ||
    (handoverTarget === 'second' && collectorId === parcel.receiverId) ||
    (handoverTarget === 'second' && collectorId !== parcel.secondReceiverId)
  )
    throw BadRequest('Select a valid collector');
  const [collector] = await tx
    .select({ id: customers.id })
    .from(customers)
    .where(
      and(
        eq(customers.id, collectorId),
        eq(customers.companyId, input.companyId),
        eq(customers.isDeleted, false),
      ),
    )
    .for('share');
  if (!collector) throw BadRequest('Collector is no longer available');
  return {
    companyId: input.companyId,
    branchId: input.branchId,
    parcelId: input.parcelId,
    workflow: 'receiver_cashier' as const,
    handoverTarget,
    receiverId: parcel.receiverId,
    collectorId: collector.id,
  };
}
