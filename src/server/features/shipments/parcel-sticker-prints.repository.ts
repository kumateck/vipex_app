import { db } from '@/db/config';
import { parcelStickerPrints } from '@/db/schemas';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export async function createParcelStickerPrintRepo(
  input: typeof parcelStickerPrints.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .insert(parcelStickerPrints)
    .values(input)
    .returning({ id: parcelStickerPrints.id });
  return row ?? null;
}
