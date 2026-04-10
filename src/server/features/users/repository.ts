import { and, asc, count, desc, eq, ilike, inArray, ne, or, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { users, roles, branches, companies, locations } from '@/db/schemas';
import type { SortField } from '@/server/types/pagination.types';

export type ListUserParams = {
  limit: number;
  offset: number;
  companyId?: string | null;
  branchId?: string | null;
  locationId?: string | null;
  roleId?: string | null;
  userType?: number | null;
  status?: number | null;
  statuses?: number[] | null;
  search?: string | null;
  sort?: SortField[] | null;
};

export type UserOptionRow = {
  id: string;
  fullname: string;
  email: string;
  branchId: string | null;
  locationId: string | null;
  branchType: number | null;
  roleName: string | null;
  branchName: string | null;
  locationName: string | null;
};

export async function listUsersRepo(p: ListUserParams) {
  const where = [];
  if (p.companyId) where.push(eq(users.companyId, p.companyId));
  if (p.branchId) where.push(eq(users.branchId, p.branchId));
  if (p.locationId) where.push(eq(users.locationId, p.locationId));
  if (p.roleId) where.push(eq(users.roleId, p.roleId));
  if (p.userType !== null && p.userType !== undefined) where.push(eq(users.userType, p.userType));
  if (p.statuses?.length) {
    where.push(inArray(users.status, p.statuses));
  } else if (p.status !== null && p.status !== undefined) {
    where.push(eq(users.status, p.status));
  }

  const sort = p.sort ?? [];
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
        .filter((value): value is ReturnType<typeof asc> => value !== null)
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
      employeeId: users.employeeId,
      branchId: users.branchId,
      locationId: users.locationId,
      userType: users.userType,
      cashierType: users.cashierType,
      createdBy: users.createdBy,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      roleName: roles.name,
      branchName: branches.name,
      locationName: locations.name,
      companyName: companies.name,
    })
    .from(users)
    .leftJoin(roles, eq(roles.id, users.roleId))
    .leftJoin(branches, eq(branches.id, users.branchId))
    .leftJoin(locations, eq(locations.id, users.locationId))
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

export async function listUserOptionsRepo(p: {
  companyId?: string | null;
  branchId?: string | null;
  locationId?: string | null;
  roleId?: string | null;
  userType?: number | null;
  status?: number | null;
  search?: string | null;
}): Promise<UserOptionRow[]> {
  const where = [];
  if (p.companyId) where.push(eq(users.companyId, p.companyId));
  if (p.branchId) where.push(eq(users.branchId, p.branchId));
  if (p.locationId) where.push(eq(users.locationId, p.locationId));
  if (p.roleId) where.push(eq(users.roleId, p.roleId));
  if (p.userType !== null && p.userType !== undefined) where.push(eq(users.userType, p.userType));
  if (p.status !== null && p.status !== undefined) where.push(eq(users.status, p.status));
  if (p.search) {
    where.push(
      or(
        ilike(users.fullname, `%${p.search}%`),
        ilike(users.email, `%${p.search}%`),
        ilike(users.telephone, `%${p.search}%`),
      ),
    );
  }

  return db
    .select({
      id: users.id,
      fullname: users.fullname,
      email: users.email,
      branchId: users.branchId,
      locationId: users.locationId,
      branchType: branches.type,
      roleName: roles.name,
      branchName: branches.name,
      locationName: locations.name,
    })
    .from(users)
    .leftJoin(roles, eq(roles.id, users.roleId))
    .leftJoin(branches, eq(branches.id, users.branchId))
    .leftJoin(locations, eq(locations.id, users.locationId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(users.fullname), asc(users.id));
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
      employeeId: users.employeeId,
      branchId: users.branchId,
      locationId: users.locationId,
      userType: users.userType,
      cashierType: users.cashierType,
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

export async function findUserByCompanyEmailRepo(input: {
  companyId: string;
  email: string;
  excludeUserId?: string | null;
}) {
  const predicates = [
    eq(users.companyId, input.companyId),
    sql`lower(${users.email}) = ${input.email}`,
  ];

  if (input.excludeUserId) {
    predicates.push(ne(users.id, input.excludeUserId));
  }

  const [row] = await db
    .select({
      id: users.id,
      companyId: users.companyId,
      email: users.email,
    })
    .from(users)
    .where(and(...predicates))
    .limit(1);

  return row ?? null;
}

export async function getBranchScopeRepo(branchId: string) {
  const [row] = await db
    .select({
      id: branches.id,
      companyId: branches.companyId,
      type: branches.type,
    })
    .from(branches)
    .where(eq(branches.id, branchId))
    .limit(1);
  return row ?? null;
}

export async function getLocationScopeRepo(locationId: string) {
  const [row] = await db
    .select({
      id: locations.id,
      companyId: locations.companyId,
      branchId: locations.branchId,
    })
    .from(locations)
    .where(eq(locations.id, locationId))
    .limit(1);
  return row ?? null;
}
