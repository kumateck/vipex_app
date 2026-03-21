import { and, asc, count, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '@/db/config';
import { cards, customerCards, customers } from '@/db/schemas';
import type { SortField } from '@/server/types/pagination.types';

export type CustomerRow = {
  id: string;
  companyId: string;
  fullname: string;
  telephone: string | null;
  telephone2: string | null;
  address: string | null;
  email: string | null;
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
  sort?: SortField[] | null;
};

export async function listCustomersRepo(
  p: ListCustomerParams,
): Promise<{ data: CustomerRow[]; totalRecords: number }> {
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

export async function findCustomersByTelephoneRepo(input: {
  companyId: string;
  telephone: string;
  limit?: number;
}): Promise<CustomerRow[]> {
  const term = input.telephone.trim();
  const limit = input.limit ?? 10;

  if (!term) return [];

  return db
    .select({
      id: customers.id,
      companyId: customers.companyId,
      fullname: customers.fullname,
      telephone: customers.telephone,
      telephone2: customers.telephone2,
      address: customers.address,
      email: customers.email,
      isNiaVerified: customers.isNiaVerified,
      loggedToGovernment: customers.loggedToGovernment,
      isDeleted: customers.isDeleted,
      createdBy: customers.createdBy,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
    })
    .from(customers)
    .where(
      and(
        eq(customers.companyId, input.companyId),
        eq(customers.isDeleted, false),
        or(
          eq(customers.telephone, term),
          eq(customers.telephone2, term),
          ilike(customers.telephone, `%${term}%`),
        ),
      ),
    )
    .orderBy(asc(customers.fullname), asc(customers.id))
    .limit(limit);
}

export type CustomerCardRow = {
  id: string;
  customerId: string;
  cardId: string;
  cardName: string;
  cardNumber: string;
  createdAt: Date;
};

export type CardOptionRow = {
  id: string;
  name: string;
};

export async function listCustomerCardsRepo(input: {
  customerId: string;
  companyId: string;
}): Promise<CustomerCardRow[]> {
  return db
    .select({
      id: customerCards.id,
      customerId: customerCards.customerId,
      cardId: customerCards.cardId,
      cardName: cards.name,
      cardNumber: customerCards.cardNumber,
      createdAt: customerCards.createdAt,
    })
    .from(customerCards)
    .innerJoin(cards, eq(cards.id, customerCards.cardId))
    .innerJoin(customers, eq(customers.id, customerCards.customerId))
    .where(
      and(eq(customerCards.customerId, input.customerId), eq(customers.companyId, input.companyId)),
    )
    .orderBy(desc(customerCards.createdAt), asc(customerCards.id));
}

export async function listCardOptionsRepo(companyId: string): Promise<CardOptionRow[]> {
  return db
    .select({
      id: cards.id,
      name: cards.name,
    })
    .from(cards)
    .where(and(eq(cards.companyId, companyId), eq(cards.isDeleted, false)))
    .orderBy(asc(cards.name), asc(cards.id));
}

export async function getCardOptionByIdRepo(input: {
  id: string;
  companyId: string;
}): Promise<CardOptionRow | null> {
  const [row] = await db
    .select({
      id: cards.id,
      name: cards.name,
    })
    .from(cards)
    .where(
      and(eq(cards.id, input.id), eq(cards.companyId, input.companyId), eq(cards.isDeleted, false)),
    )
    .limit(1);
  return row ?? null;
}

export async function findCustomerCardByTypeAndNumberRepo(input: {
  customerId: string;
  cardId: string;
  cardNumber: string;
}): Promise<{ id: string } | null> {
  const [row] = await db
    .select({ id: customerCards.id })
    .from(customerCards)
    .where(
      and(
        eq(customerCards.customerId, input.customerId),
        eq(customerCards.cardId, input.cardId),
        eq(customerCards.cardNumber, input.cardNumber),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function createCustomerCardRepo(input: {
  customerId: string;
  cardId: string;
  cardNumber: string;
}): Promise<{ id: string }> {
  const [row] = await db
    .insert(customerCards)
    .values({
      customerId: input.customerId,
      cardId: input.cardId,
      cardNumber: input.cardNumber,
    })
    .returning({ id: customerCards.id });
  return row!;
}
