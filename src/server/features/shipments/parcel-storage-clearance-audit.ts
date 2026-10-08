import { db } from '@/db/config';
import { auditLogs } from '@/db/schemas/audit';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function recordStorageClearanceAudit(
  tx: Transaction,
  input: Omit<typeof auditLogs.$inferInsert, 'id' | 'createdAt'>,
) {
  await tx.insert(auditLogs).values(input);
}
