import { auditLogs } from '@/db/schemas';
import type { DbExecutor } from '../shipments/parcel-repositories/parcel-repository.types';

export function recordBatchSignatureAudit(
  tx: DbExecutor,
  input: {
    companyId: string;
    actorId: string;
    id: string;
    requestId: string;
    parcelIds: string[];
    action: 'requested' | 'saved' | 'cancelled';
  },
) {
  return tx.insert(auditLogs).values({
    companyId: input.companyId,
    actorUserId: input.actorId,
    entityType: 'parcel_batch',
    entityId: input.id,
    action: `PARCEL_BATCH_SIGNATURE_${input.action.toUpperCase()}`,
    message: `Batch signature ${input.action}`,
    metadata: { batchHandoverId: input.id, requestId: input.requestId, parcelIds: input.parcelIds },
  });
}
