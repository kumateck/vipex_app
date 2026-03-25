import { and, asc, count, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { cards, customerCards } from '@/db/schemas';
import type { SortField } from '@/server/types/pagination.types';

export type ListCardParams = {
  limit: number;
  offset: number;
  companyId?: string | null;
  includeDeleted?: boolean | null;
  sort?: SortField[] | null;
};

export async function listCardsRepo(p: ListCardParams) {
  const where = [];
  if (p.companyId) where.push(eq(cards.companyId, p.companyId));
  if (!p.includeDeleted) where.push(eq(cards.isDeleted, false));
  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((s) => {
          if (s.field === 'createdAt')
            return s.direction === 'desc' ? desc(cards.createdAt) : asc(cards.createdAt);
          if (s.field === 'name')
            return s.direction === 'desc' ? desc(cards.name) : asc(cards.name);
          if (s.field === 'id') return s.direction === 'desc' ? desc(cards.id) : asc(cards.id);
          return null;
        })
        .filter((value): value is ReturnType<typeof asc> => value !== null)
    : [asc(cards.createdAt), asc(cards.id)];

  const [countRow] = await db
    .select({ c: count() })
    .from(cards)
    .where(where.length ? and(...where) : undefined);
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);
  const rows = await db
    .select({
      id: cards.id,
      companyId: cards.companyId,
      name: cards.name,
      isDeleted: cards.isDeleted,
      createdBy: cards.createdBy,
      createdAt: cards.createdAt,
      updatedAt: cards.updatedAt,
    })
    .from(cards)
    .where(where.length ? and(...where) : undefined)
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  return { data: rows, totalRecords };
}

export async function getCardRepo(id: string) {
  const [row] = await db
    .select({
      id: cards.id,
      companyId: cards.companyId,
      name: cards.name,
      isDeleted: cards.isDeleted,
      createdBy: cards.createdBy,
      createdAt: cards.createdAt,
      updatedAt: cards.updatedAt,
    })
    .from(cards)
    .where(eq(cards.id, id))
    .limit(1);
  return row ?? null;
}

export async function findCardByNameRepo(companyId: string, name: string) {
  const [row] = await db
    .select({ id: cards.id, isDeleted: cards.isDeleted })
    .from(cards)
    .where(and(eq(cards.companyId, companyId), sql`lower(${cards.name}) = lower(${name})`))
    .limit(1);
  return row ?? null;
}

export async function createCardRepo(values: typeof cards.$inferInsert) {
  const [row] = await db.insert(cards).values(values).returning({ id: cards.id });
  return row;
}

export async function updateCardRepo(id: string, patch: Partial<typeof cards.$inferInsert>) {
  const [row] = await db
    .update(cards)
    .set(patch)
    .where(eq(cards.id, id))
    .returning({ id: cards.id });
  return row ?? null;
}

export async function softDeleteCardRepo(id: string) {
  const rows = await db
    .update(cards)
    .set({ isDeleted: true })
    .where(eq(cards.id, id))
    .returning({ id: cards.id });
  return rows.length;
}

export async function checkCardHasAssociationsRepo(cardId: string): Promise<boolean> {
  const [row] = await db
    .select({ c: count() })
    .from(customerCards)
    .where(eq(customerCards.cardId, cardId));
  const associationCount = Number((row?.c as unknown as bigint) ?? 0n);
  return associationCount > 0;
}
