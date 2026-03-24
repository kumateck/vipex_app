import { and, asc, count, desc, eq, gte, ilike, isNull, lte, ne, or, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  cards,
  customerCards,
  customerCreditAllocations,
  customerCreditTransactions,
  customers,
  parcels,
  payments,
} from '@/db/schemas';
import { CustomerCreditSourceType, CustomerCreditTransactionType, Payer } from '@/db/schemas/enums';
import type { SortField } from '@/server/types/pagination.types';
type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

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

export async function getCustomerCardRepo(input: { id: string; customerId: string }): Promise<{
  id: string;
  customerId: string;
  cardId: string;
  cardNumber: string;
  frontImageUrl: string | null;
  backImageUrl: string | null;
} | null> {
  const [row] = await db
    .select({
      id: customerCards.id,
      customerId: customerCards.customerId,
      cardId: customerCards.cardId,
      cardNumber: customerCards.cardNumber,
      frontImageUrl: customerCards.frontImageUrl,
      backImageUrl: customerCards.backImageUrl,
    })
    .from(customerCards)
    .where(and(eq(customerCards.id, input.id), eq(customerCards.customerId, input.customerId)))
    .limit(1);
  return row ?? null;
}

export async function updateCustomerCardRepo(
  id: string,
  patch: {
    cardId?: string;
    cardNumber?: string;
    frontImageUrl?: string | null;
    backImageUrl?: string | null;
  },
): Promise<{ id: string } | null> {
  const [row] = await db
    .update(customerCards)
    .set(patch)
    .where(eq(customerCards.id, id))
    .returning({ id: customerCards.id });
  return row ?? null;
}

export type CustomerCreditTransactionRow = {
  id: string;
  companyId: string;
  customerId: string;
  sourceType: number;
  transactionType: number;
  referenceId: string | null;
  signedAmountPsw: number;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
};

export async function listCustomerCreditTransactionsRepo(input: {
  customerId: string;
  companyId: string;
  limit?: number;
  dateFrom?: Date | null;
  dateTo?: Date | null;
}): Promise<CustomerCreditTransactionRow[]> {
  return db
    .select({
      id: customerCreditTransactions.id,
      companyId: customerCreditTransactions.companyId,
      customerId: customerCreditTransactions.customerId,
      sourceType: customerCreditTransactions.sourceType,
      transactionType: customerCreditTransactions.transactionType,
      referenceId: customerCreditTransactions.referenceId,
      signedAmountPsw: customerCreditTransactions.signedAmountPsw,
      notes: customerCreditTransactions.notes,
      createdBy: customerCreditTransactions.createdBy,
      createdAt: customerCreditTransactions.createdAt,
    })
    .from(customerCreditTransactions)
    .where(
      and(
        eq(customerCreditTransactions.customerId, input.customerId),
        eq(customerCreditTransactions.companyId, input.companyId),
        ...(input.dateFrom ? [gte(customerCreditTransactions.createdAt, input.dateFrom)] : []),
        ...(input.dateTo ? [lte(customerCreditTransactions.createdAt, input.dateTo)] : []),
      ),
    )
    .orderBy(desc(customerCreditTransactions.createdAt), desc(customerCreditTransactions.id))
    .limit(input.limit ?? 100);
}

export async function getCustomerCreditBalancePswRepo(input: {
  customerId: string;
  companyId: string;
  executor?: DbExecutor;
}): Promise<number> {
  const [row] = await (input.executor ?? db)
    .select({
      balance: sql<number>`COALESCE(SUM(${customerCreditTransactions.signedAmountPsw}), 0)`,
    })
    .from(customerCreditTransactions)
    .where(
      and(
        eq(customerCreditTransactions.customerId, input.customerId),
        eq(customerCreditTransactions.companyId, input.companyId),
      ),
    );

  return Number(row?.balance ?? 0);
}

export async function createCustomerCreditTransactionRepo(input: {
  companyId: string;
  customerId: string;
  sourceType?: CustomerCreditSourceType;
  transactionType?: CustomerCreditTransactionType;
  referenceId?: string | null;
  signedAmountPsw: number;
  notes?: string | null;
  createdBy: string;
  executor?: DbExecutor;
}): Promise<{ id: string }> {
  const [row] = await (input.executor ?? db)
    .insert(customerCreditTransactions)
    .values({
      companyId: input.companyId,
      customerId: input.customerId,
      sourceType: input.sourceType ?? CustomerCreditSourceType.MANUAL,
      transactionType: input.transactionType ?? CustomerCreditTransactionType.CHARGE,
      referenceId: input.referenceId ?? null,
      signedAmountPsw: input.signedAmountPsw,
      notes: input.notes ?? null,
      createdBy: input.createdBy,
    })
    .returning({ id: customerCreditTransactions.id });
  return row!;
}

export async function createCustomerCreditAllocationRepo(input: {
  companyId: string;
  customerId: string;
  chargeTransactionId: string;
  paymentTransactionId: string;
  amountPsw: number;
  createdBy: string;
}): Promise<{ id: string }> {
  const [row] = await db
    .insert(customerCreditAllocations)
    .values({
      companyId: input.companyId,
      customerId: input.customerId,
      chargeTransactionId: input.chargeTransactionId,
      paymentTransactionId: input.paymentTransactionId,
      amountPsw: input.amountPsw,
      createdBy: input.createdBy,
    })
    .returning({ id: customerCreditAllocations.id });
  return row!;
}

export type OpenCreditChargeRow = {
  chargeTransactionId: string;
  createdAt: Date;
  referenceId: string | null;
  notes: string | null;
  chargeAmountPsw: number;
  allocatedAmountPsw: number;
  outstandingAmountPsw: number;
};

export async function listCustomerOpenCreditChargesRepo(input: {
  customerId: string;
  companyId: string;
}): Promise<OpenCreditChargeRow[]> {
  const rows = await db.execute(sql<{
    charge_transaction_id: string;
    created_at: Date;
    reference_id: string | null;
    notes: string | null;
    charge_amount_psw: string | number;
    allocated_amount_psw: string | number;
    outstanding_amount_psw: string | number;
  }>`
    WITH charge_rows AS (
      SELECT
        cct.id AS charge_transaction_id,
        cct.created_at,
        cct.reference_id,
        cct.notes,
        cct.signed_amount_psw::bigint AS charge_amount_psw
      FROM customer_credit_transactions cct
      WHERE cct.customer_id = ${input.customerId}
        AND cct.company_id = ${input.companyId}
        AND cct.transaction_type = ${CustomerCreditTransactionType.CHARGE}
        AND cct.signed_amount_psw > 0
    ),
    allocations AS (
      SELECT
        cca.charge_transaction_id,
        COALESCE(SUM(cca.amount_psw), 0)::bigint AS allocated_amount_psw
      FROM customer_credit_allocations cca
      WHERE cca.customer_id = ${input.customerId}
        AND cca.company_id = ${input.companyId}
      GROUP BY cca.charge_transaction_id
    )
    SELECT
      cr.charge_transaction_id,
      cr.created_at,
      cr.reference_id,
      cr.notes,
      cr.charge_amount_psw,
      COALESCE(a.allocated_amount_psw, 0)::bigint AS allocated_amount_psw,
      (cr.charge_amount_psw - COALESCE(a.allocated_amount_psw, 0))::bigint AS outstanding_amount_psw
    FROM charge_rows cr
    LEFT JOIN allocations a ON a.charge_transaction_id = cr.charge_transaction_id
    WHERE (cr.charge_amount_psw - COALESCE(a.allocated_amount_psw, 0)) > 0
    ORDER BY cr.created_at ASC, cr.charge_transaction_id ASC
  `);

  return rows.map((row) => {
    const typed = row as {
      charge_transaction_id: string;
      created_at: string | Date;
      reference_id: string | null;
      notes: string | null;
      charge_amount_psw: string | number;
      allocated_amount_psw: string | number;
      outstanding_amount_psw: string | number;
    };
    return {
      chargeTransactionId: typed.charge_transaction_id,
      createdAt: new Date(typed.created_at),
      referenceId: typed.reference_id,
      notes: typed.notes,
      chargeAmountPsw: Number(typed.charge_amount_psw),
      allocatedAmountPsw: Number(typed.allocated_amount_psw),
      outstandingAmountPsw: Number(typed.outstanding_amount_psw),
    };
  });
}

export type CustomerStatementParcelRow = {
  id: string;
  companyId: string;
  bookingCode: string;
  trackingCode: string;
  chargePsw: number;
  plannedToBePaidPsw: number;
  method: number;
  status: number;
  createdAt: Date;
};

export async function listCustomerStatementSentParcelsRepo(input: {
  customerId: string;
  companyId: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  limit?: number;
}): Promise<CustomerStatementParcelRow[]> {
  return db
    .select({
      id: parcels.id,
      companyId: parcels.companyId,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      chargePsw: parcels.chargePsw,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
      method: parcels.method,
      status: parcels.status,
      createdAt: parcels.createdAt,
    })
    .from(parcels)
    .where(
      and(
        eq(parcels.companyId, input.companyId),
        eq(parcels.senderId, input.customerId),
        eq(parcels.isDeleted, false),
        ...(input.dateFrom ? [gte(parcels.createdAt, input.dateFrom)] : []),
        ...(input.dateTo ? [lte(parcels.createdAt, input.dateTo)] : []),
      ),
    )
    .orderBy(desc(parcels.createdAt), desc(parcels.id))
    .limit(input.limit ?? 300);
}

export async function listCustomerStatementReceivedParcelsRepo(input: {
  customerId: string;
  companyId: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  limit?: number;
}): Promise<CustomerStatementParcelRow[]> {
  return db
    .select({
      id: parcels.id,
      companyId: parcels.companyId,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      chargePsw: parcels.chargePsw,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
      method: parcels.method,
      status: parcels.status,
      createdAt: parcels.createdAt,
    })
    .from(parcels)
    .where(
      and(
        eq(parcels.companyId, input.companyId),
        eq(parcels.isDeleted, false),
        or(
          eq(parcels.receiverId, input.customerId),
          eq(parcels.secondReceiverId, input.customerId),
        ),
        ...(input.dateFrom ? [gte(parcels.createdAt, input.dateFrom)] : []),
        ...(input.dateTo ? [lte(parcels.createdAt, input.dateTo)] : []),
      ),
    )
    .orderBy(desc(parcels.createdAt), desc(parcels.id))
    .limit(input.limit ?? 300);
}

export type CustomerStatementPaymentRow = {
  id: string;
  parcelId: string;
  bookingCode: string;
  trackingCode: string;
  payer: number;
  method: number;
  component: number;
  grossAmountPsw: number;
  receivedAt: Date;
  senderId: string;
  receiverId: string;
  secondReceiverId: string | null;
};

export async function listCustomerStatementPaymentsRepo(input: {
  customerId: string;
  companyId: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  limit?: number;
}): Promise<CustomerStatementPaymentRow[]> {
  return db
    .select({
      id: payments.id,
      parcelId: payments.parcelId,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      payer: payments.payer,
      method: payments.method,
      component: payments.component,
      grossAmountPsw: payments.grossAmountPsw,
      receivedAt: payments.receivedAt,
      senderId: parcels.senderId,
      receiverId: parcels.receiverId,
      secondReceiverId: parcels.secondReceiverId,
    })
    .from(payments)
    .innerJoin(parcels, eq(parcels.id, payments.parcelId))
    .where(
      and(
        eq(payments.companyId, input.companyId),
        eq(parcels.companyId, input.companyId),
        isNull(payments.voidedAt),
        or(
          eq(parcels.senderId, input.customerId),
          eq(parcels.receiverId, input.customerId),
          eq(parcels.secondReceiverId, input.customerId),
        ),
        ...(input.dateFrom ? [gte(payments.receivedAt, input.dateFrom)] : []),
        ...(input.dateTo ? [lte(payments.receivedAt, input.dateTo)] : []),
      ),
    )
    .orderBy(desc(payments.receivedAt), desc(payments.id))
    .limit(input.limit ?? 500);
}

export async function getCustomerCreditBalanceBeforeDateRepo(input: {
  customerId: string;
  companyId: string;
  before: Date;
}): Promise<number> {
  const beforeIso = input.before.toISOString();

  const [row] = await db
    .select({
      balance: sql<number>`COALESCE(SUM(${customerCreditTransactions.signedAmountPsw}), 0)`,
    })
    .from(customerCreditTransactions)
    .where(
      and(
        eq(customerCreditTransactions.customerId, input.customerId),
        eq(customerCreditTransactions.companyId, input.companyId),
        sql`${customerCreditTransactions.createdAt} < ${beforeIso}`,
      ),
    );

  return Number(row?.balance ?? 0);
}

export async function listCustomerCreditTransactionsByDateRepo(input: {
  customerId: string;
  companyId: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  limit?: number;
}): Promise<CustomerCreditTransactionRow[]> {
  return db
    .select({
      id: customerCreditTransactions.id,
      companyId: customerCreditTransactions.companyId,
      customerId: customerCreditTransactions.customerId,
      sourceType: customerCreditTransactions.sourceType,
      transactionType: customerCreditTransactions.transactionType,
      referenceId: customerCreditTransactions.referenceId,
      signedAmountPsw: customerCreditTransactions.signedAmountPsw,
      notes: customerCreditTransactions.notes,
      createdBy: customerCreditTransactions.createdBy,
      createdAt: customerCreditTransactions.createdAt,
    })
    .from(customerCreditTransactions)
    .where(
      and(
        eq(customerCreditTransactions.customerId, input.customerId),
        eq(customerCreditTransactions.companyId, input.companyId),
        ...(input.dateFrom ? [gte(customerCreditTransactions.createdAt, input.dateFrom)] : []),
        ...(input.dateTo ? [lte(customerCreditTransactions.createdAt, input.dateTo)] : []),
      ),
    )
    .orderBy(desc(customerCreditTransactions.createdAt), desc(customerCreditTransactions.id))
    .limit(input.limit ?? 500);
}

export type CustomerTransactionRow = {
  id: string;
  bookingCode: string;
  trackingCode: string;
  sourceId: string;
  destinationId: string;
  status: number;
  chargePsw: number;
  method: number;
  senderId: string;
  receiverId: string;
  secondReceiverId: string | null;
  createdAt: Date;
};

export async function listCustomerTransactionsRepo(input: {
  customerId: string;
  companyId: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  limit: number;
  offset: number;
}): Promise<{ data: CustomerTransactionRow[]; totalRecords: number }> {
  const where = and(
    eq(parcels.companyId, input.companyId),
    or(
      eq(parcels.senderId, input.customerId),
      eq(parcels.receiverId, input.customerId),
      eq(parcels.secondReceiverId, input.customerId),
    ),
    eq(parcels.isDeleted, false),
    ...(input.dateFrom ? [gte(parcels.createdAt, input.dateFrom)] : []),
    ...(input.dateTo ? [lte(parcels.createdAt, input.dateTo)] : []),
  );

  const [countRow] = await db.select({ c: count() }).from(parcels).where(where);
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);

  const data = await db
    .select({
      id: parcels.id,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      sourceId: parcels.sourceId,
      destinationId: parcels.destinationId,
      status: parcels.status,
      chargePsw: parcels.chargePsw,
      method: parcels.method,
      senderId: parcels.senderId,
      receiverId: parcels.receiverId,
      secondReceiverId: parcels.secondReceiverId,
      createdAt: parcels.createdAt,
    })
    .from(parcels)
    .where(where)
    .orderBy(desc(parcels.createdAt), desc(parcels.id))
    .limit(input.limit)
    .offset(input.offset);

  return { data, totalRecords };
}

export type CustomerPaymentRow = {
  id: string;
  source: 'PARCEL_PAYMENT' | 'CREDIT_PAYMENT';
  amountPsw: number;
  method: number | null;
  bookingCode: string | null;
  trackingCode: string | null;
  notes: string | null;
  createdAt: Date;
};

export async function listCustomerParcelPaymentsRepo(input: {
  customerId: string;
  companyId: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  limit?: number;
}): Promise<CustomerPaymentRow[]> {
  const rows = await db
    .select({
      id: payments.id,
      amountPsw: payments.grossAmountPsw,
      method: payments.method,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      notes: payments.notes,
      createdAt: payments.receivedAt,
    })
    .from(payments)
    .innerJoin(parcels, eq(parcels.id, payments.parcelId))
    .where(
      and(
        eq(payments.companyId, input.companyId),
        eq(parcels.companyId, input.companyId),
        isNull(payments.voidedAt),
        or(
          and(eq(payments.payer, Payer.SENDER), eq(parcels.senderId, input.customerId)),
          and(
            eq(payments.payer, Payer.RECIPIENT),
            or(
              eq(parcels.receiverId, input.customerId),
              eq(parcels.secondReceiverId, input.customerId),
            ),
          ),
        ),
        ...(input.dateFrom ? [gte(payments.receivedAt, input.dateFrom)] : []),
        ...(input.dateTo ? [lte(payments.receivedAt, input.dateTo)] : []),
      ),
    )
    .orderBy(desc(payments.receivedAt), desc(payments.id))
    .limit(input.limit ?? 1000);

  return rows.map((row) => ({
    id: row.id,
    source: 'PARCEL_PAYMENT',
    amountPsw: row.amountPsw,
    method: row.method,
    bookingCode: row.bookingCode,
    trackingCode: row.trackingCode,
    notes: row.notes,
    createdAt: row.createdAt,
  }));
}

export async function listCustomerCreditPaymentsRepo(input: {
  customerId: string;
  companyId: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  limit?: number;
}): Promise<CustomerPaymentRow[]> {
  const rows = await db
    .select({
      id: customerCreditTransactions.id,
      amountPsw: customerCreditTransactions.signedAmountPsw,
      notes: customerCreditTransactions.notes,
      createdAt: customerCreditTransactions.createdAt,
    })
    .from(customerCreditTransactions)
    .where(
      and(
        eq(customerCreditTransactions.customerId, input.customerId),
        eq(customerCreditTransactions.companyId, input.companyId),
        eq(customerCreditTransactions.transactionType, CustomerCreditTransactionType.PAYMENT),
        ...(input.dateFrom ? [gte(customerCreditTransactions.createdAt, input.dateFrom)] : []),
        ...(input.dateTo ? [lte(customerCreditTransactions.createdAt, input.dateTo)] : []),
      ),
    )
    .orderBy(desc(customerCreditTransactions.createdAt), desc(customerCreditTransactions.id))
    .limit(input.limit ?? 1000);

  return rows.map((row) => ({
    id: row.id,
    source: 'CREDIT_PAYMENT',
    amountPsw: Math.abs(row.amountPsw),
    method: null,
    bookingCode: null,
    trackingCode: null,
    notes: row.notes,
    createdAt: row.createdAt,
  }));
}

export type CustomerTransactionsMonthlyRow = {
  month: number;
  sentCount: number;
  receivedCount: number;
  sentAmountPsw: number;
  receivedAmountPsw: number;
};

export async function listCustomerTransactionsMonthlyRepo(input: {
  customerId: string;
  companyId: string;
  year: number;
}): Promise<CustomerTransactionsMonthlyRow[]> {
  const dateFromIso = new Date(Date.UTC(input.year, 0, 1, 0, 0, 0, 0)).toISOString();
  const dateToIso = new Date(Date.UTC(input.year, 11, 31, 23, 59, 59, 999)).toISOString();

  const rows = await db.execute(sql<{
    month: number | string;
    sent_count: number | string;
    received_count: number | string;
    sent_amount_psw: number | string;
    received_amount_psw: number | string;
  }>`
    SELECT
      EXTRACT(MONTH FROM p.created_at)::int AS month,
      COALESCE(SUM(CASE WHEN p.sender_id = ${input.customerId} THEN 1 ELSE 0 END), 0)::int AS sent_count,
      COALESCE(SUM(CASE WHEN (p.receiver_id = ${input.customerId} OR p.second_receiver_id = ${input.customerId}) THEN 1 ELSE 0 END), 0)::int AS received_count,
      COALESCE(SUM(CASE WHEN p.sender_id = ${input.customerId} THEN p.charge_psw ELSE 0 END), 0)::bigint AS sent_amount_psw,
      COALESCE(SUM(CASE WHEN (p.receiver_id = ${input.customerId} OR p.second_receiver_id = ${input.customerId}) THEN p.planned_tobepaid_psw ELSE 0 END), 0)::bigint AS received_amount_psw
    FROM parcels p
    WHERE p.company_id = ${input.companyId}
      AND p.is_deleted = false
      AND p.created_at >= ${dateFromIso}
      AND p.created_at <= ${dateToIso}
      AND (
        p.sender_id = ${input.customerId}
        OR p.receiver_id = ${input.customerId}
        OR p.second_receiver_id = ${input.customerId}
      )
    GROUP BY EXTRACT(MONTH FROM p.created_at)
    ORDER BY month ASC
  `);

  return rows.map((row) => {
    const typed = row as {
      month: number | string;
      sent_count: number | string;
      received_count: number | string;
      sent_amount_psw: number | string;
      received_amount_psw: number | string;
    };
    return {
      month: Number(typed.month),
      sentCount: Number(typed.sent_count),
      receivedCount: Number(typed.received_count),
      sentAmountPsw: Number(typed.sent_amount_psw),
      receivedAmountPsw: Number(typed.received_amount_psw),
    };
  });
}
