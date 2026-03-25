import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { uploads } from '@/db/schemas';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export async function createUploadRepo(
  values: typeof uploads.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor.insert(uploads).values(values).returning();
  return row ?? null;
}

export async function listUploadsRepo(input: {
  companyId: string;
  modelType: string;
  modelId: string;
}) {
  return db
    .select()
    .from(uploads)
    .where(
      and(
        eq(uploads.companyId, input.companyId),
        eq(uploads.modelType, input.modelType),
        eq(uploads.modelId, input.modelId),
        eq(uploads.isDeleted, false),
      ),
    )
    .orderBy(desc(uploads.createdAt), desc(uploads.id));
}

export async function getUploadRepo(id: string, companyId: string, executor: DbExecutor = db) {
  const [row] = await executor
    .select()
    .from(uploads)
    .where(and(eq(uploads.id, id), eq(uploads.companyId, companyId), eq(uploads.isDeleted, false)))
    .limit(1);
  return row ?? null;
}

export async function deleteUploadRepo(id: string, companyId: string, executor: DbExecutor = db) {
  const [row] = await executor
    .update(uploads)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(and(eq(uploads.id, id), eq(uploads.companyId, companyId), eq(uploads.isDeleted, false)))
    .returning();
  return row ?? null;
}
