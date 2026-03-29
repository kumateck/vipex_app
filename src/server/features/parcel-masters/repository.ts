import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcelContentCatalog, parcelDetailCatalog } from '@/db/schemas';

export async function listParcelContentOptionsRepo(input: {
  companyId: string;
  activeOnly?: boolean | null;
  search?: string | null;
}) {
  const where = [eq(parcelContentCatalog.companyId, input.companyId)];
  if (input.activeOnly ?? true) {
    where.push(eq(parcelContentCatalog.active, true));
  }
  if (input.search?.trim()) {
    where.push(sql`${parcelContentCatalog.name} ILIKE ${`%${input.search.trim()}%`}`);
  }
  return db
    .select({
      id: parcelContentCatalog.id,
      name: parcelContentCatalog.name,
      description: parcelContentCatalog.description,
      basePricePsw: parcelContentCatalog.basePricePsw,
      taxInclusive: parcelContentCatalog.taxInclusive,
      active: parcelContentCatalog.active,
      sortOrder: parcelContentCatalog.sortOrder,
    })
    .from(parcelContentCatalog)
    .where(and(...where))
    .orderBy(asc(parcelContentCatalog.sortOrder), asc(parcelContentCatalog.name));
}

export async function listParcelDetailOptionsRepo(input: {
  companyId: string;
  activeOnly?: boolean | null;
  search?: string | null;
}) {
  const where = [eq(parcelDetailCatalog.companyId, input.companyId)];
  if (input.activeOnly ?? true) {
    where.push(eq(parcelDetailCatalog.active, true));
  }
  if (input.search?.trim()) {
    where.push(sql`${parcelDetailCatalog.name} ILIKE ${`%${input.search.trim()}%`}`);
  }
  return db
    .select({
      id: parcelDetailCatalog.id,
      name: parcelDetailCatalog.name,
      description: parcelDetailCatalog.description,
      active: parcelDetailCatalog.active,
      sortOrder: parcelDetailCatalog.sortOrder,
    })
    .from(parcelDetailCatalog)
    .where(and(...where))
    .orderBy(asc(parcelDetailCatalog.sortOrder), asc(parcelDetailCatalog.name));
}

export async function findParcelContentByNameRepo(companyId: string, name: string) {
  const [row] = await db
    .select({
      id: parcelContentCatalog.id,
      active: parcelContentCatalog.active,
    })
    .from(parcelContentCatalog)
    .where(
      and(
        eq(parcelContentCatalog.companyId, companyId),
        sql`lower(${parcelContentCatalog.name}) = lower(${name})`,
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function findParcelDetailByNameRepo(companyId: string, name: string) {
  const [row] = await db
    .select({
      id: parcelDetailCatalog.id,
      active: parcelDetailCatalog.active,
    })
    .from(parcelDetailCatalog)
    .where(
      and(
        eq(parcelDetailCatalog.companyId, companyId),
        sql`lower(${parcelDetailCatalog.name}) = lower(${name})`,
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getParcelContentRepo(companyId: string, id: string) {
  const [row] = await db
    .select({
      id: parcelContentCatalog.id,
      companyId: parcelContentCatalog.companyId,
      name: parcelContentCatalog.name,
      description: parcelContentCatalog.description,
      basePricePsw: parcelContentCatalog.basePricePsw,
      taxInclusive: parcelContentCatalog.taxInclusive,
      active: parcelContentCatalog.active,
      sortOrder: parcelContentCatalog.sortOrder,
      createdAt: parcelContentCatalog.createdAt,
      updatedAt: parcelContentCatalog.updatedAt,
    })
    .from(parcelContentCatalog)
    .where(and(eq(parcelContentCatalog.companyId, companyId), eq(parcelContentCatalog.id, id)))
    .limit(1);
  return row ?? null;
}

export async function getParcelDetailRepo(companyId: string, id: string) {
  const [row] = await db
    .select({
      id: parcelDetailCatalog.id,
      companyId: parcelDetailCatalog.companyId,
      name: parcelDetailCatalog.name,
      description: parcelDetailCatalog.description,
      active: parcelDetailCatalog.active,
      sortOrder: parcelDetailCatalog.sortOrder,
      createdAt: parcelDetailCatalog.createdAt,
      updatedAt: parcelDetailCatalog.updatedAt,
    })
    .from(parcelDetailCatalog)
    .where(and(eq(parcelDetailCatalog.companyId, companyId), eq(parcelDetailCatalog.id, id)))
    .limit(1);
  return row ?? null;
}

export async function createParcelContentRepo(values: typeof parcelContentCatalog.$inferInsert) {
  const [row] = await db
    .insert(parcelContentCatalog)
    .values(values)
    .returning({ id: parcelContentCatalog.id });
  return row ?? null;
}

export async function createParcelDetailRepo(values: typeof parcelDetailCatalog.$inferInsert) {
  const [row] = await db
    .insert(parcelDetailCatalog)
    .values(values)
    .returning({ id: parcelDetailCatalog.id });
  return row ?? null;
}

export async function updateParcelContentRepo(
  id: string,
  patch: Partial<typeof parcelContentCatalog.$inferInsert>,
) {
  const [row] = await db
    .update(parcelContentCatalog)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(parcelContentCatalog.id, id))
    .returning({ id: parcelContentCatalog.id });
  return row ?? null;
}

export async function updateParcelDetailRepo(
  id: string,
  patch: Partial<typeof parcelDetailCatalog.$inferInsert>,
) {
  const [row] = await db
    .update(parcelDetailCatalog)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(parcelDetailCatalog.id, id))
    .returning({ id: parcelDetailCatalog.id });
  return row ?? null;
}
