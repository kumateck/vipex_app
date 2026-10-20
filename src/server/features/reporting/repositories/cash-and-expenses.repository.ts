import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import {
  branches,
  dailyCashConfirmations,
  expenseCategories,
  expenseRequests,
  locations,
  users,
} from '@/db/schemas';

export async function listDailyCashConfirmationReportRowsRepo(input: {
  companyId: string;
  branchId?: string | null;
  from: Date;
  to: Date;
  status?: number | null;
}) {
  const cashierUser = alias(users, 'report_cashier_user');
  const accountantUser = alias(users, 'report_accountant_user');

  return db
    .select({
      id: dailyCashConfirmations.id,
      branchId: dailyCashConfirmations.branchId,
      branchName: branches.name,
      locationId: dailyCashConfirmations.locationId,
      locationName: locations.name,
      cashierUserId: dailyCashConfirmations.cashierUserId,
      cashierName: cashierUser.fullname,
      accountantUserId: dailyCashConfirmations.accountantUserId,
      accountantName: accountantUser.fullname,
      confirmationDate: dailyCashConfirmations.confirmationDate,
      expectedCashPsw: dailyCashConfirmations.expectedCashPsw,
      countedCashPsw: dailyCashConfirmations.countedCashPsw,
      shortagePsw: dailyCashConfirmations.shortagePsw,
      overagePsw: dailyCashConfirmations.overagePsw,
      status: dailyCashConfirmations.status,
      notes: dailyCashConfirmations.notes,
      confirmedAt: dailyCashConfirmations.confirmedAt,
      postedAt: dailyCashConfirmations.postedAt,
      createdAt: dailyCashConfirmations.createdAt,
    })
    .from(dailyCashConfirmations)
    .leftJoin(branches, eq(branches.id, dailyCashConfirmations.branchId))
    .leftJoin(locations, eq(locations.id, dailyCashConfirmations.locationId))
    .leftJoin(cashierUser, eq(cashierUser.id, dailyCashConfirmations.cashierUserId))
    .leftJoin(accountantUser, eq(accountantUser.id, dailyCashConfirmations.accountantUserId))
    .where(
      and(
        eq(dailyCashConfirmations.companyId, input.companyId),
        gte(dailyCashConfirmations.confirmationDate, input.from),
        lte(dailyCashConfirmations.confirmationDate, input.to),
        ...(input.branchId ? [eq(dailyCashConfirmations.branchId, input.branchId)] : []),
        ...(input.status !== null && input.status !== undefined
          ? [eq(dailyCashConfirmations.status, input.status)]
          : []),
      ),
    )
    .orderBy(
      desc(dailyCashConfirmations.confirmationDate),
      asc(branches.name),
      asc(locations.name),
      asc(dailyCashConfirmations.id),
    );
}

export async function listExpenseByCategorySummaryRowsRepo(input: {
  companyId: string;
  branchId?: string | null;
  from: Date;
  to: Date;
  status?: number | null;
}) {
  return db
    .select({
      expenseCategoryId: expenseCategories.id,
      expenseCategoryCode: expenseCategories.code,
      expenseCategoryName: expenseCategories.name,
      accountName: sql<string | null>`coa.name`,
      requests: sql<number>`COUNT(${expenseRequests.id})::int`,
      totalAmountPsw: sql<number>`COALESCE(SUM(${expenseRequests.amountPsw}), 0)::bigint`,
      recordedPsw: sql<number>`COALESCE(SUM(CASE WHEN ${expenseRequests.status} = 0 THEN ${expenseRequests.amountPsw} ELSE 0 END), 0)::bigint`,
      submittedPsw: sql<number>`COALESCE(SUM(CASE WHEN ${expenseRequests.status} = 1 THEN ${expenseRequests.amountPsw} ELSE 0 END), 0)::bigint`,
      approvedPsw: sql<number>`COALESCE(SUM(CASE WHEN ${expenseRequests.status} = 2 THEN ${expenseRequests.amountPsw} ELSE 0 END), 0)::bigint`,
      paidPsw: sql<number>`COALESCE(SUM(CASE WHEN ${expenseRequests.status} = 4 THEN ${expenseRequests.amountPsw} ELSE 0 END), 0)::bigint`,
      postedPsw: sql<number>`COALESCE(SUM(CASE WHEN ${expenseRequests.status} = 5 THEN ${expenseRequests.amountPsw} ELSE 0 END), 0)::bigint`,
    })
    .from(expenseRequests)
    .innerJoin(expenseCategories, eq(expenseCategories.id, expenseRequests.expenseCategoryId))
    .leftJoin(sql`chart_of_accounts coa`, sql`coa.id = ${expenseCategories.accountId}`)
    .where(
      and(
        eq(expenseRequests.companyId, input.companyId),
        gte(expenseRequests.createdAt, input.from),
        lte(expenseRequests.createdAt, input.to),
        ...(input.branchId ? [eq(expenseRequests.branchId, input.branchId)] : []),
        ...(input.status !== null && input.status !== undefined
          ? [eq(expenseRequests.status, input.status)]
          : []),
      ),
    )
    .groupBy(expenseCategories.id, expenseCategories.code, expenseCategories.name, sql`coa.name`)
    .orderBy(
      desc(sql`COALESCE(SUM(${expenseRequests.amountPsw}), 0)`),
      asc(expenseCategories.name),
    );
}

export async function listExpenseByCategoryDetailRowsRepo(input: {
  companyId: string;
  branchId?: string | null;
  from: Date;
  to: Date;
  status?: number | null;
}) {
  const requestedBy = alias(users, 'report_expense_requested_by');
  const approvedBy = alias(users, 'report_expense_approved_by');
  const paidBy = alias(users, 'report_expense_paid_by');

  return db
    .select({
      id: expenseRequests.id,
      branchId: expenseRequests.branchId,
      branchName: branches.name,
      locationId: expenseRequests.locationId,
      locationName: locations.name,
      expenseCategoryId: expenseRequests.expenseCategoryId,
      expenseCategoryCode: expenseCategories.code,
      expenseCategoryName: expenseCategories.name,
      amountPsw: expenseRequests.amountPsw,
      fundingSource: expenseRequests.fundingSource,
      status: expenseRequests.status,
      purpose: expenseRequests.purpose,
      referenceNo: expenseRequests.referenceNo,
      requestedByUserId: expenseRequests.requestedByUserId,
      requestedByName: requestedBy.fullname,
      approvedByUserId: expenseRequests.approvedByUserId,
      approvedByName: approvedBy.fullname,
      paidByUserId: expenseRequests.paidByUserId,
      paidByName: paidBy.fullname,
      paidAt: expenseRequests.paidAt,
      postedAt: expenseRequests.postedAt,
      createdAt: expenseRequests.createdAt,
    })
    .from(expenseRequests)
    .innerJoin(expenseCategories, eq(expenseCategories.id, expenseRequests.expenseCategoryId))
    .leftJoin(branches, eq(branches.id, expenseRequests.branchId))
    .leftJoin(locations, eq(locations.id, expenseRequests.locationId))
    .leftJoin(requestedBy, eq(requestedBy.id, expenseRequests.requestedByUserId))
    .leftJoin(approvedBy, eq(approvedBy.id, expenseRequests.approvedByUserId))
    .leftJoin(paidBy, eq(paidBy.id, expenseRequests.paidByUserId))
    .where(
      and(
        eq(expenseRequests.companyId, input.companyId),
        gte(expenseRequests.createdAt, input.from),
        lte(expenseRequests.createdAt, input.to),
        ...(input.branchId ? [eq(expenseRequests.branchId, input.branchId)] : []),
        ...(input.status !== null && input.status !== undefined
          ? [eq(expenseRequests.status, input.status)]
          : []),
      ),
    )
    .orderBy(desc(expenseRequests.createdAt), asc(expenseCategories.name), asc(expenseRequests.id));
}
