import { and, asc, eq, gt, ilike, or } from 'drizzle-orm';
import { db } from '@/db/config';
import { customers } from '@/db/schemas';
import type { CursorKey } from '@/server/utils/cursor';

export type CustomerRow = {
  id: string;
  companyId: string;
  fullname: string;
  telephone: string | null;
  telephone2: string | null;
  address: string | null;
  email: string | null;
  isDeleted: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ListCustomerParams = {
  limit: number;
  after?: CursorKey | null;
  companyId: string;
  search?: string | null;
  includeDeleted?: boolean | null;
};

export async function listCustomersRepo(
  p: ListCustomerParams,
): Promise<{ data: CustomerRow[]; nextCursor: CursorKey | null }> {
  const whereParts: (ReturnType<typeof eq> | ReturnType<typeof and> | ReturnType<typeof or>)[] = [
    eq(customers.companyId, p.companyId),
  ];
  if (!p.includeDeleted) whereParts.push(eq(customers.isDeleted, false));
  if (p.search) {
    whereParts.push(
      or(
        ilike(customers.fullname, `%${p.search}%`),
        ilike(customers.telephone, `%${p.search}%`),
        ilike(customers.email, `%${p.search}%`),
      ),
    );
  }
  if (p.after) {
    whereParts.push(
      or(
        gt(customers.createdAt, new Date(p.after.createdAt)),
        and(eq(customers.createdAt, new Date(p.after.createdAt)), gt(customers.id, p.after.id)),
      ),
    );
  }

  const rows = await db
    .select({
      id: customers.id,
      companyId: customers.companyId,
      fullname: customers.fullname,
      telephone: customers.telephone,
      telephone2: customers.telephone2,
      address: customers.address,
      email: customers.email,
      isDeleted: customers.isDeleted,
      createdBy: customers.createdBy,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
    })
    .from(customers)
    .where(and(...whereParts))
    .orderBy(asc(customers.createdAt), asc(customers.id))
    .limit(p.limit + 1);

  const hasMore = rows.length > p.limit;
  const data = hasMore ? rows.slice(0, p.limit) : rows;
  const nextCursor = hasMore
    ? { createdAt: data[data.length - 1]!.createdAt.toISOString(), id: data[data.length - 1]!.id }
    : null;
  return { data, nextCursor };
}

export async function getCustomerRepo(id: string): Promise<CustomerRow | null> {
  const [row] = await db
    .select({
      id: customers.id,
      companyId: customers.companyId,
      fullname: customers.fullname,
      telephone: customers.telephone,
      telephone2: customers.telephone2,
      address: customers.address,
      email: customers.email,
      isDeleted: customers.isDeleted,
      createdBy: customers.createdBy,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
    })
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);
  return row ?? null;
}

export async function createCustomerRepo(
  values: typeof customers.$inferInsert,
): Promise<{ id: string }> {
  const [row] = await db.insert(customers).values(values).returning({ id: customers.id });
  return row!;
}

export async function updateCustomerRepo(
  id: string,
  patch: Partial<typeof customers.$inferInsert>,
): Promise<{ id: string } | null> {
  const [row] = await db
    .update(customers)
    .set(patch)
    .where(eq(customers.id, id))
    .returning({ id: customers.id });
  return row ?? null;
}

export async function softDeleteCustomerRepo(id: string): Promise<number> {
  const rows = await db
    .update(customers)
    .set({ isDeleted: true })
    .where(eq(customers.id, id))
    .returning({ id: customers.id });
  return rows.length;
}
