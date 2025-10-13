import { and, asc, eq, gt, ilike, or } from 'drizzle-orm';
import { db } from '@/db/config';
import { users, roles, branches, companies } from '@/db/schemas';

export type ListUserParams = {
  limit: number;
  after?: { createdAt: string; id: string } | null;
  companyId?: string | null;
  branchId?: string | null;
  roleId?: string | null;
  status?: number | null;
  search?: string | null;
};

export async function listUsersRepo(p: ListUserParams) {
  const where = [];
  if (p.companyId) where.push(eq(users.companyId, p.companyId));
  if (p.branchId) where.push(eq(users.branchId, p.branchId));
  if (p.roleId) where.push(eq(users.roleId, p.roleId));
  if (p.status !== null && p.status !== undefined) where.push(eq(users.status, p.status));

  if (p.after) {
    where.push(
      or(
        gt(users.createdAt, new Date(p.after.createdAt)),
        and(eq(users.createdAt, new Date(p.after.createdAt)), gt(users.id, p.after.id)),
      ),
    );
  }

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
    .orderBy(asc(users.createdAt), asc(users.id))
    .limit(p.limit + 1);

  const rows = await q;
  const hasMore = rows.length > p.limit;
  const data = hasMore ? rows.slice(0, p.limit) : rows;
  const nextCursor = hasMore
    ? { createdAt: data[data.length - 1]!.createdAt!.toISOString(), id: data[data.length - 1]!.id }
    : null;

  return { data, nextCursor };
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
