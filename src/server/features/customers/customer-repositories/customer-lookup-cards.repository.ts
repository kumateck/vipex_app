import { and, asc, desc, eq, ilike, ne, or } from 'drizzle-orm';
import { db } from '@/db/config';
import { cards, customerCards, customers } from '@/db/schemas';
import { type DbExecutor, type CustomerRow } from './customer-profile.repository';

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
    .where(
      and(
        eq(customers.companyId, input.companyId),
        eq(customers.isDeleted, false),
        /^\d{10}$/.test(term)
          ? or(eq(customers.telephone, term), eq(customers.telephone2, term))
          : or(ilike(customers.telephone, `%${term}%`), ilike(customers.telephone2, `%${term}%`)),
      ),
    )
    .orderBy(asc(customers.fullname), asc(customers.id))
    .limit(limit);
}

export async function findCustomerNameByExactTelephoneRepo(
  input: {
    companyId: string;
    telephone: string;
  },
  executor: DbExecutor = db,
): Promise<{
  id: string;
  fullname: string;
  telephone: string | null;
  telephone2: string | null;
} | null> {
  const term = input.telephone.trim();
  if (!term) return null;

  const [row] = await executor
    .select({
      id: customers.id,
      fullname: customers.fullname,
      telephone: customers.telephone,
      telephone2: customers.telephone2,
    })
    .from(customers)
    .where(
      and(
        eq(customers.companyId, input.companyId),
        eq(customers.isDeleted, false),
        or(eq(customers.telephone, term), eq(customers.telephone2, term)),
      ),
    )
    .orderBy(asc(customers.id))
    .limit(1);

  return row ?? null;
}

export type CustomerCardRow = {
  id: string;
  customerId: string;
  cardId: string;
  cardName: string;
  cardNumber: string;
  frontImageUrl: string | null;
  backImageUrl: string | null;
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
      frontImageUrl: customerCards.frontImageUrl,
      backImageUrl: customerCards.backImageUrl,
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
  excludeCardRecordId?: string | null;
}): Promise<{ id: string } | null> {
  const [row] = await db
    .select({ id: customerCards.id })
    .from(customerCards)
    .where(
      and(
        eq(customerCards.customerId, input.customerId),
        eq(customerCards.cardId, input.cardId),
        eq(customerCards.cardNumber, input.cardNumber),
        ...(input.excludeCardRecordId ? [ne(customerCards.id, input.excludeCardRecordId)] : []),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function createCustomerCardRepo(input: {
  customerId: string;
  cardId: string;
  cardNumber: string;
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
}): Promise<{ id: string }> {
  const [row] = await db
    .insert(customerCards)
    .values({
      customerId: input.customerId,
      cardId: input.cardId,
      cardNumber: input.cardNumber,
      frontImageUrl: input.frontImageUrl ?? null,
      backImageUrl: input.backImageUrl ?? null,
    })
    .returning({ id: customerCards.id });
  return row!;
}
