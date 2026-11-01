import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { customerCards, customerCreditAllocations, customerCreditTransactions } from '@/db/schemas';
import { CustomerCreditSourceType, CustomerCreditTransactionType } from '@/db/schemas/enums';
import { type DbExecutor } from './customer-profile.repository';

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
