import { and, asc, count, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  branches,
  dailyCashConfirmations,
  reconciliationBankSettlements,
  users,
} from '@/db/schemas';

export type ListReconciliationSessionsParams = {
  companyId: string;
  limit: number;
  offset: number;
  search?: string | null;
  status?: number | null;
  branchId?: string | null;
  pendingOnly?: boolean | null;
};

export type ListBankSettlementsParams = {
  companyId: string;
  limit: number;
  offset: number;
  search?: string | null;
  status?: number | null;
  branchId?: string | null;
  pendingOnly?: boolean | null;
};

export async function listReconciliationSessionsRepo(params: ListReconciliationSessionsParams) {
  const where = [eq(dailyCashConfirmations.companyId, params.companyId)];
  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    where.push(
      or(
        ilike(branches.name, q),
        ilike(users.fullname, q),
        ilike(dailyCashConfirmations.notes, q),
      )!,
    );
  }
  if (params.branchId) {
    where.push(eq(dailyCashConfirmations.branchId, params.branchId));
  }
  if (typeof params.status === 'number') {
    where.push(eq(dailyCashConfirmations.status, params.status));
  }
  if (params.pendingOnly) {
    where.push(or(eq(dailyCashConfirmations.status, 0), eq(dailyCashConfirmations.status, 1))!);
  }

  const [countRow] = await db
    .select({ c: count() })
    .from(dailyCashConfirmations)
    .leftJoin(branches, eq(branches.id, dailyCashConfirmations.branchId))
    .leftJoin(users, eq(users.id, dailyCashConfirmations.cashierUserId))
    .where(and(...where));

  const rows = await db
    .select({
      id: dailyCashConfirmations.id,
      branchId: dailyCashConfirmations.branchId,
      branchName: branches.name,
      cashierUserId: dailyCashConfirmations.cashierUserId,
      cashierName: users.fullname,
      confirmationDate: dailyCashConfirmations.confirmationDate,
      expectedCashPsw: dailyCashConfirmations.expectedCashPsw,
      countedCashPsw: dailyCashConfirmations.countedCashPsw,
      shortagePsw: dailyCashConfirmations.shortagePsw,
      overagePsw: dailyCashConfirmations.overagePsw,
      notes: dailyCashConfirmations.notes,
      status: dailyCashConfirmations.status,
      confirmedAt: dailyCashConfirmations.confirmedAt,
      postedAt: dailyCashConfirmations.postedAt,
      createdAt: dailyCashConfirmations.createdAt,
      updatedAt: dailyCashConfirmations.updatedAt,
    })
    .from(dailyCashConfirmations)
    .leftJoin(branches, eq(branches.id, dailyCashConfirmations.branchId))
    .leftJoin(users, eq(users.id, dailyCashConfirmations.cashierUserId))
    .where(and(...where))
    .orderBy(desc(dailyCashConfirmations.confirmationDate), desc(dailyCashConfirmations.id))
    .limit(params.limit)
    .offset(params.offset);

  return {
    data: rows,
    totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n),
  };
}

export async function listBankSettlementsRepo(params: ListBankSettlementsParams) {
  const where = [eq(reconciliationBankSettlements.companyId, params.companyId)];
  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    where.push(
      or(
        ilike(reconciliationBankSettlements.settlementNo, q),
        ilike(reconciliationBankSettlements.bankReference, q),
        ilike(branches.name, q),
      )!,
    );
  }
  if (params.branchId) {
    where.push(eq(reconciliationBankSettlements.branchId, params.branchId));
  }
  if (typeof params.status === 'number') {
    where.push(eq(reconciliationBankSettlements.status, params.status));
  }
  if (params.pendingOnly) {
    where.push(eq(reconciliationBankSettlements.status, 0));
  }

  const [countRow] = await db
    .select({ c: count() })
    .from(reconciliationBankSettlements)
    .leftJoin(branches, eq(branches.id, reconciliationBankSettlements.branchId))
    .where(and(...where));

  const rows = await db
    .select({
      id: reconciliationBankSettlements.id,
      settlementNo: reconciliationBankSettlements.settlementNo,
      settlementDate: reconciliationBankSettlements.settlementDate,
      branchId: reconciliationBankSettlements.branchId,
      branchName: branches.name,
      bankReference: reconciliationBankSettlements.bankReference,
      expectedAmountPsw: reconciliationBankSettlements.expectedAmountPsw,
      bankedAmountPsw: reconciliationBankSettlements.bankedAmountPsw,
      variancePsw: reconciliationBankSettlements.variancePsw,
      notes: reconciliationBankSettlements.notes,
      status: reconciliationBankSettlements.status,
      approvedByUserId: reconciliationBankSettlements.approvedByUserId,
      rejectedByUserId: reconciliationBankSettlements.rejectedByUserId,
      rejectionReason: reconciliationBankSettlements.rejectionReason,
      approvedAt: reconciliationBankSettlements.approvedAt,
      rejectedAt: reconciliationBankSettlements.rejectedAt,
      createdAt: reconciliationBankSettlements.createdAt,
      updatedAt: reconciliationBankSettlements.updatedAt,
    })
    .from(reconciliationBankSettlements)
    .leftJoin(branches, eq(branches.id, reconciliationBankSettlements.branchId))
    .where(and(...where))
    .orderBy(
      desc(reconciliationBankSettlements.settlementDate),
      desc(reconciliationBankSettlements.id),
    )
    .limit(params.limit)
    .offset(params.offset);

  return {
    data: rows,
    totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n),
  };
}

export async function createBankSettlementRepo(
  values: typeof reconciliationBankSettlements.$inferInsert,
) {
  const [row] = await db
    .insert(reconciliationBankSettlements)
    .values(values)
    .returning({ id: reconciliationBankSettlements.id });
  return row;
}

export async function getBankSettlementByIdRepo(id: string, companyId: string) {
  const [row] = await db
    .select({
      id: reconciliationBankSettlements.id,
      settlementNo: reconciliationBankSettlements.settlementNo,
      status: reconciliationBankSettlements.status,
    })
    .from(reconciliationBankSettlements)
    .where(
      and(
        eq(reconciliationBankSettlements.id, id),
        eq(reconciliationBankSettlements.companyId, companyId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function updateBankSettlementStatusRepo(
  id: string,
  companyId: string,
  patch: Partial<typeof reconciliationBankSettlements.$inferInsert>,
) {
  const [row] = await db
    .update(reconciliationBankSettlements)
    .set(patch)
    .where(
      and(
        eq(reconciliationBankSettlements.id, id),
        eq(reconciliationBankSettlements.companyId, companyId),
      ),
    )
    .returning({ id: reconciliationBankSettlements.id });
  return row ?? null;
}

export async function findBankSettlementByNoRepo(companyId: string, settlementNo: string) {
  const [row] = await db
    .select({ id: reconciliationBankSettlements.id })
    .from(reconciliationBankSettlements)
    .where(
      and(
        eq(reconciliationBankSettlements.companyId, companyId),
        eq(reconciliationBankSettlements.settlementNo, settlementNo),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listBranchOptionsForReconciliationRepo(companyId: string) {
  return db
    .select({
      id: branches.id,
      name: branches.name,
    })
    .from(branches)
    .where(eq(branches.companyId, companyId))
    .orderBy(asc(branches.name), asc(branches.id));
}
