import { and, asc, count, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '@/db/config';
import { users, roles, branches, companies } from '@/db/schemas';
import type { SortField } from '@/server/types/pagination.types';

export type ListUserParams = {
  limit: number;
  offset: number;
  companyId?: string | null;
  branchId?: string | null;
  roleId?: string | null;
  status?: number | null;
  search?: string | null;
  sort?: SortField[] | null;
};

export async function listUsersRepo(p: ListUserParams) {
  const where = [];
  if (p.companyId) where.push(eq(users.companyId, p.companyId));
  if (p.branchId) where.push(eq(users.branchId, p.branchId));
  if (p.roleId) where.push(eq(users.roleId, p.roleId));
  if (p.status !== null && p.status !== undefined) where.push(eq(users.status, p.status));

  const sort = (p.sort ?? []).filter(Boolean);
  const orderBy = sort.length
    ? sort
        .map((s) => {
          if (s.field === 'createdAt')
            return s.direction === 'desc' ? desc(users.createdAt) : asc(users.createdAt);
          if (s.field === 'fullname')
            return s.direction === 'desc' ? desc(users.fullname) : asc(users.fullname);
          if (s.field === 'email')
            return s.direction === 'desc' ? desc(users.email) : asc(users.email);
          if (s.field === 'id') return s.direction === 'desc' ? desc(users.id) : asc(users.id);
          return null;
        })
        .filter(Boolean)
    : [asc(users.createdAt), asc(users.id)];

  const countQuery = db
    .select({ c: count() })
    .from(users)
    .where(
      where.length || p.search
        ? and(
            ...where,
            ...(p.search
              ? [
                  or(
                    ilike(users.fullname, `%${p.search}%`),
                    ilike(users.email, `%${p.search}%`),
                    ilike(users.telephone, `%${p.search}%`),
                  ),
                ]
              : []),
          )
        : undefined,
    );

  const [countRow] = await countQuery;
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);

  const q = db
    .select({
      id: users.id,
      fullname: users.fullname,
      telephone: users.telephone,
      email: users.email,
      status: users.status,
      roleId: users.roleId,
      companyId: users.companyId,
      branchId: users.branchId,
      createdBy: users.createdBy,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      roleName: roles.name,
      branchName: branches.name,
      companyName: companies.name,
    })
    .from(users)
    .leftJoin(roles, eq(roles.id, users.roleId))
    .leftJoin(branches, eq(branches.id, users.branchId))
    .leftJoin(companies, eq(companies.id, users.companyId))
    .where(
      where.length || p.search
        ? and(
            ...where,
            ...(p.search
              ? [
                  or(
                    ilike(users.fullname, `%${p.search}%`),
                    ilike(users.email, `%${p.search}%`),
                    ilike(users.telephone, `%${p.search}%`),
                  ),
                ]
              : []),
          )
        : undefined,
    )
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  const rows = await q;

  return { data: rows, totalRecords };
}

export async function getUserRepo(id: string) {
  const [row] = await db
    .select({
      id: users.id,
      fullname: users.fullname,
      telephone: users.telephone,
      email: users.email,
      status: users.status,
      roleId: users.roleId,
      companyId: users.companyId,
      branchId: users.branchId,
      createdBy: users.createdBy,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return row ?? null;
}

export async function createUserRepo(input: typeof users.$inferInsert) {
  const [row] = await db.insert(users).values(input).returning({ id: users.id });
  return row;
}

export async function updateUserRepo(id: string, patch: Partial<typeof users.$inferInsert>) {
  const [row] = await db
    .update(users)
    .set(patch)
    .where(eq(users.id, id))
    .returning({ id: users.id });
  return row ?? null;
}
