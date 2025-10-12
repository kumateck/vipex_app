import { and, asc, eq, gt, or } from 'drizzle-orm';
import { db } from '../../../db/config';
import { users } from '../../../db/schema';

export type UserRow = typeof users.$inferSelect;

export type ListUsersParams = {
  limit: number;
  after?: { createdAt: string; id: string } | null;
};

export async function listUsersRepo({ limit, after }: ListUsersParams) {
  const conditions = [];
  if (after) {
    conditions.push(
      or(
        gt(users.createdAt, new Date(after.createdAt)),
        and(eq(users.createdAt, new Date(after.createdAt)), gt(users.id, after.id)),
      ),
    );
  }

  const rows = await db
    .select({
      id: users.id,
      fullname: users.fullname,
      email: users.email,
      telephone: users.telephone,
      userStatus: users.userStatus,
      companyId: users.companyId,
      branchId: users.branchId,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(users.createdAt), asc(users.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;

  const nextCursor = hasMore
    ? {
        createdAt: data[data.length - 1]!.createdAt!.toISOString(),
        id: data[data.length - 1]!.id,
      }
    : null;

  return { data, nextCursor };
}

export async function getUserByIdRepo(id: string) {
  const [row] = await db
    .select({
      id: users.id,
      fullname: users.fullname,
      email: users.email,
      telephone: users.telephone,
      userStatus: users.userStatus,
      companyId: users.companyId,
      branchId: users.branchId,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return row ?? null;
}

export async function getUserByEmailRepo(email: string) {
  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return row ?? null;
}

export async function createUserRepo(data: {
  id: string;
  fullname: string;
  email: string;
  telephone: string;
  passwordHash: string;
  roleId: string;
  companyId: string;
  branchId: string;
  createdBy: string;
}) {
  await db.insert(users).values({
    id: data.id,
    fullname: data.fullname,
    email: data.email,
    telephone: data.telephone,
    password: data.passwordHash,
    userStatus: 'ACTIVE',
    roleId: data.roleId,
    companyId: data.companyId,
    branchId: data.branchId,
    createdBy: data.createdBy,
  });
  return data.id;
}
