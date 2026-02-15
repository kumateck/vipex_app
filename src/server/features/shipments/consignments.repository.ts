import { and, eq, isNull, max } from 'drizzle-orm';
import { db } from '@/db/config';
import { consignments, consignmentItems } from '@/db/schemas';

export type ConsignmentRow = {
  id: string;
  companyId: string;
  sourceId: string;
  destinationId: string;
  consignmentDate: Date;
  serialForDay: number;
  code: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function getNextSerialForDayRepo(
  companyId: string,
  sourceId: string,
  consignmentDate: Date,
): Promise<number> {
  const [r] = await db
    .select({ m: max(consignments.serialForDay).as('m') })
    .from(consignments)
    .where(
      and(
        eq(consignments.companyId, companyId),
        eq(consignments.sourceId, sourceId),
        eq(consignments.consignmentDate, consignmentDate),
      ),
    );
  const currentMax = (r?.m as number | null) ?? 0;
  return (currentMax ?? 0) + 1;
}

export async function createConsignmentRepo(
  values: typeof consignments.$inferInsert,
): Promise<{ id: string }> {
  const [row] = await db.insert(consignments).values(values).returning({ id: consignments.id });
  if (!row) {
    throw new Error('Failed to create consignment');
  }
  return row;
}

export type ConsignmentItemRow = {
  consignmentId: string;
  parcelId: string;
  addedAt: Date;
  removedAt: Date | null;
};

export async function addConsignmentItemsRepo(
  items: { consignmentId: string; parcelId: string }[],
): Promise<number> {
  if (items.length === 0) return 0;
  const rows = await db
    .insert(consignmentItems)
    .values(items.map((i) => ({ consignmentId: i.consignmentId, parcelId: i.parcelId })))
    .returning({ consignmentId: consignmentItems.consignmentId });
  return rows.length;
}

export async function removeConsignmentItemRepo(
  consignmentId: string,
  parcelId: string,
  removedAt: Date,
): Promise<number> {
  const rows = await db
    .update(consignmentItems)
    .set({ removedAt })
    .where(
      and(
        eq(consignmentItems.consignmentId, consignmentId),
        eq(consignmentItems.parcelId, parcelId),
        isNull(consignmentItems.removedAt),
      ),
    )
    .returning({ parcelId: consignmentItems.parcelId });
  return rows.length;
}
