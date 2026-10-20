import { and, eq } from 'drizzle-orm';
import { parcels, cashierSessions } from '@/db/schemas';
import { NotFound, Forbidden } from '@/server/utils/http-error';
import type { DbExecutor } from './types';

export async function lockSenderProcessingSessionRepo(
  sessionId: string,
  input: { cashierUserId: string; branchId: string },
  executor: DbExecutor,
) {
  const [session] = await executor
    .select({ id: cashierSessions.id })
    .from(cashierSessions)
    .where(
      and(
        eq(cashierSessions.id, sessionId),
        eq(cashierSessions.cashierId, input.cashierUserId),
        eq(cashierSessions.branchId, input.branchId),
        eq(cashierSessions.status, 'ACTIVE'),
      ),
    )
    .for('share');
  if (!session) throw Forbidden('An active cashier session is required to perform this action');
}

export async function lockSenderProcessingParcelRepo(
  input: { parcelId: string; companyId: string; branchId: string },
  executor: DbExecutor,
) {
  const [parcel] = await executor
    .select({
      id: parcels.id,
      status: parcels.status,
      cashierSessionId: parcels.cashierSessionId,
    })
    .from(parcels)
    .where(
      and(
        eq(parcels.id, input.parcelId),
        eq(parcels.companyId, input.companyId),
        eq(parcels.sourceId, input.branchId),
        eq(parcels.isDeleted, false),
      ),
    )
    .for('update');
  if (!parcel) throw NotFound('Parcel not found at your source branch');
  return parcel;
}
