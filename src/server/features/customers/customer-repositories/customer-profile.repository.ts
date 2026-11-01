import { and, asc, count, desc, eq, ilike, ne, or } from 'drizzle-orm';
import { db } from '@/db/config';
import { customers } from '@/db/schemas';
import type { SortField } from '@/server/types/pagination.types';

export type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export type CustomerRow = {
  id: string;
  companyId: string;
  fullname: string;
  telephone: string | null;
  telephone2: string | null;
  address: string | null;
  email: string | null;
  customerType: number;
  creditEligible: boolean;
  creditLimitPsw: number;
  paymentTermsDays: number;
  isNiaVerified: boolean;
  loggedToGovernment: boolean;
  isDeleted: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ListCustomerParams = {
  limit: number;
  offset: number;
  companyId: string;
  search?: string | null;
  includeDeleted?: boolean | null;
  customerType?: number;
  sort?: SortField[] | null;
};

export async function listCustomersRepo(
  p: ListCustomerParams,
): Promise<{ data: CustomerRow[]; totalRecords: number }> {
  const whereParts: (ReturnType<typeof eq> | ReturnType<typeof and> | ReturnType<typeof or>)[] = [
    eq(customers.companyId, p.companyId),
  ];
  if (!p.includeDeleted) whereParts.push(eq(customers.isDeleted, false));
  if (p.customerType != null) whereParts.push(eq(customers.customerType, p.customerType));
  if (p.search) {
    whereParts.push(
      or(
        ilike(customers.fullname, `%${p.search}%`),
        ilike(customers.telephone, `%${p.search}%`),
        ilike(customers.telephone2, `%${p.search}%`),
        ilike(customers.email, `%${p.search}%`),
      ),
    );
  }
  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((s) => {
          if (s.field === 'createdAt')
            return s.direction === 'desc' ? desc(customers.createdAt) : asc(customers.createdAt);
          if (s.field === 'fullname')
            return s.direction === 'desc' ? desc(customers.fullname) : asc(customers.fullname);
          if (s.field === 'email')
            return s.direction === 'desc' ? desc(customers.email) : asc(customers.email);
          if (s.field === 'id')
            return s.direction === 'desc' ? desc(customers.id) : asc(customers.id);
          return null;
        })
        .filter((value): value is ReturnType<typeof asc> => value !== null)
    : [asc(customers.createdAt), asc(customers.id)];

  const [countRow] = await db
    .select({ c: count() })
    .from(customers)
    .where(and(...whereParts));
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);

  const rows = await db
    .select({
      id: customers.id,
      companyId: customers.companyId,
      fullname: customers.fullname,
      telephone: customers.telephone,
      telephone2: customers.telephone2,
      address: customers.address,
      email: customers.email,
      customerType: customers.customerType,
      creditEligible: customers.creditEligible,
      creditLimitPsw: customers.creditLimitPsw,
      paymentTermsDays: customers.paymentTermsDays,
      isNiaVerified: customers.isNiaVerified,
      loggedToGovernment: customers.loggedToGovernment,
      isDeleted: customers.isDeleted,
      createdBy: customers.createdBy,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
    })
    .from(customers)
    .where(and(...whereParts))
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  return { data: rows, totalRecords };
}

export async function getCustomerRepo(
  id: string,
  executor: DbExecutor = db,
): Promise<CustomerRow | null> {
  const [row] = await executor
    .select({
      id: customers.id,
      companyId: customers.companyId,
      fullname: customers.fullname,
      telephone: customers.telephone,
      telephone2: customers.telephone2,
      address: customers.address,
      email: customers.email,
      customerType: customers.customerType,
      creditEligible: customers.creditEligible,
      creditLimitPsw: customers.creditLimitPsw,
      paymentTermsDays: customers.paymentTermsDays,
      isNiaVerified: customers.isNiaVerified,
      loggedToGovernment: customers.loggedToGovernment,
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

export async function findCustomerByCompanyTelephonesRepo(input: {
  companyId: string;
  telephones: string[];
  excludeCustomerId?: string | null;
}): Promise<Pick<CustomerRow, 'id' | 'telephone' | 'telephone2'> | null> {
  const normalized = Array.from(
    new Set(input.telephones.map((value) => value.trim()).filter((value) => value.length > 0)),
  );
  if (normalized.length === 0) return null;

  const phonePredicates = normalized.map((value) =>
    or(eq(customers.telephone, value), eq(customers.telephone2, value)),
  );
  const whereParts = [
    eq(customers.companyId, input.companyId),
    eq(customers.isDeleted, false),
    or(...phonePredicates),
  ];

  if (input.excludeCustomerId) {
    whereParts.push(ne(customers.id, input.excludeCustomerId));
  }

  const [row] = await db
    .select({
      id: customers.id,
      telephone: customers.telephone,
      telephone2: customers.telephone2,
    })
    .from(customers)
    .where(and(...whereParts))
    .limit(1);

  return row ?? null;
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
