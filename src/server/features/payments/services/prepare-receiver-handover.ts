import { createId } from '@paralleldrive/cuid2';
import { and, eq } from 'drizzle-orm';
import { customers, users, UserStatus } from '@/db/schemas';
import { BadRequest } from '@/server/utils/http-error';
import type { PendingReceiverHandover } from '@/shared/shipments/pending-receiver-handover';
import type { DbExecutor } from '../../shipments/parcel-repositories/parcel-repository.types';

type Input = Omit<
  PendingReceiverHandover,
  'id' | 'requestedAt' | 'collectorId' | 'collectorName' | 'associateName' | 'capture'
> & {
  secondReceiverId: string | null;
};

export async function prepareReceiverHandover(
  { companyId, branchId, secondReceiverId, ...pending }: Input,
  tx: DbExecutor,
): Promise<PendingReceiverHandover> {
  const collectorId = pending.handoverTarget === 'main' ? pending.receiverId : secondReceiverId;
  if (!collectorId || (pending.handoverTarget === 'second' && collectorId === pending.receiverId)) {
    throw BadRequest('Select a valid collector');
  }
  const [[collector], [associate]] = await Promise.all([
    tx
      .select({ name: customers.fullname })
      .from(customers)
      .where(
        and(
          eq(customers.id, collectorId),
          eq(customers.companyId, companyId),
          eq(customers.isDeleted, false),
        ),
      ),
    tx
      .select({ name: users.fullname })
      .from(users)
      .where(
        and(
          eq(users.id, pending.associateId),
          eq(users.companyId, companyId),
          eq(users.branchId, branchId),
          eq(users.status, UserStatus.ACTIVE),
        ),
      ),
  ]);
  if (!collector) throw BadRequest('Collector is no longer available');
  if (!associate) throw BadRequest('Select an active parcel associate at this branch');
  return {
    ...pending,
    companyId,
    branchId,
    id: createId(),
    requestedAt: new Date().toISOString(),
    collectorId,
    collectorName: collector.name,
    associateName: associate.name,
  };
}
