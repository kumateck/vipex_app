import { and, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { momoTransactions } from '@/db/schemas';

export async function createMomoTransactionRepo(values: typeof momoTransactions.$inferInsert) {
  const [row] = await db.insert(momoTransactions).values(values).returning();
  return row ?? null;
}

export async function getMomoTransactionByIdRepo(id: string, companyId: string) {
  const [row] = await db
    .select()
    .from(momoTransactions)
    .where(and(eq(momoTransactions.id, id), eq(momoTransactions.companyId, companyId)))
    .limit(1);

  return row ?? null;
}

export async function getMomoTransactionByExternalRefRepo(externalReferenceId: string) {
  const [row] = await db
    .select()
    .from(momoTransactions)
    .where(eq(momoTransactions.externalReferenceId, externalReferenceId))
    .limit(1);

  return row ?? null;
}

export async function updateMomoTransactionStatusRepo(
  id: string,
  patch: Partial<typeof momoTransactions.$inferInsert>,
) {
  const [row] = await db
    .update(momoTransactions)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(momoTransactions.id, id))
    .returning();

  return row ?? null;
}
