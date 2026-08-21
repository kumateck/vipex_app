import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  lt,
  or,
  sql,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import {
  attendanceRecords,
  branches,
  cashierSessions,
  dailyCashConfirmations,
  deliveries,
  customers,
  departments,
  employees,
  expenseCategories,
  expenseRequests,
  chartOfAccounts,
  jobTitles,
  journalBatches,
  journalEntries,
  journalLines,
  leaveRequests,
  leaveTypes,
  locations,
  parcels,
  payrollManualAdjustments,
  payrollOvertimeEntries,
  payrollPeriods,
  payrollRunEmployees,
  payrollRuns,
  parcelStorageWaivers,
  payments,
  shiftTypes,
  users,
} from '@/db/schemas';
import {
  CustomerCreditSourceType,
  CustomerCreditTransactionType,
  CashierType,
  ParcelStatus,
  PaymentComponent,
  PaymentMethod,
} from '@/db/schemas/enums';

export type CashierSessionReportRow = {
  id: string;
  cashierId: string;
  branchId: string;
  scheduledStartTime: Date;
  actualEndTime: Date | null;
  openingBalancePsw: number;
  closingBalancePsw: number | null;
  status: string;
};

export type DailyCashConfirmationReportRow = {
  id: string;
  branchId: string;
  branchName: string | null;
  locationId: string | null;
  locationName: string | null;
  cashierUserId: string | null;
  cashierName: string | null;
  accountantUserId: string | null;
  accountantName: string | null;
  confirmationDate: Date;
  expectedCashPsw: number;
  countedCashPsw: number;
  shortagePsw: number;
  overagePsw: number;
  status: number;
  notes: string | null;
  confirmedAt: Date | null;
  postedAt: Date | null;
  createdAt: Date;
};

export type ExpenseByCategoryReportSummaryRow = {
  expenseCategoryId: string;
  expenseCategoryCode: string;
  expenseCategoryName: string;
  accountName: string | null;
  requests: number;
  totalAmountPsw: number;
  recordedPsw: number;
  submittedPsw: number;
  approvedPsw: number;
  paidPsw: number;
  postedPsw: number;
};

export type ExpenseByCategoryReportDetailRow = {
  id: string;
  branchId: string;
  branchName: string | null;
  locationId: string | null;
  locationName: string | null;
  expenseCategoryId: string;
  expenseCategoryCode: string;
  expenseCategoryName: string;
  amountPsw: number;
  fundingSource: number;
  status: number;
  purpose: string;
  referenceNo: string | null;
  requestedByUserId: string;
  requestedByName: string | null;
  approvedByUserId: string | null;
  approvedByName: string | null;
  paidByUserId: string | null;
  paidByName: string | null;
  paidAt: Date | null;
  postedAt: Date | null;
  createdAt: Date;
};

export type PayrollJournalReconciliationLineRow = {
  lineId: string;
  entryId: string;
  batchId: string;
  entryDate: Date;
  memo: string | null;
  accountId: string;
  accountCode: string;
  accountName: string;
  branchId: string | null;
  branchName: string | null;
  debitPsw: number;
  creditPsw: number;
  description: string | null;
  metadata: unknown;
};

export type DeliveryPerformanceReportRow = {
  deliveryId: string;
  parcelId: string;
  mode: number;
  deliveryStatus: string;
  parcelStatus: number;
  riderUserId: string | null;
  riderName: string | null;
  destinationBranchId: string;
  destinationBranchName: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  trackingCode: string;
  bookingCode: string;
  deliveryFeePsw: number;
  amountPaidPsw: number;
  plannedToBePaidPsw: number;
  dropoffAddress: string | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function listJournalLinesForBatchDetailedRepo(batchId: string) {
  return db
    .select({
      lineId: journalLines.id,
      entryId: journalEntries.id,
      batchId: journalEntries.batchId,
      entryDate: journalEntries.entryDate,
      memo: journalEntries.memo,
      accountId: chartOfAccounts.id,
      accountCode: chartOfAccounts.code,
      accountName: chartOfAccounts.name,
      branchId: journalLines.branchId,
      branchName: branches.name,
      debitPsw: journalLines.debitPsw,
      creditPsw: journalLines.creditPsw,
      description: journalLines.description,
      metadata: journalLines.metadata,
    })
    .from(journalLines)
    .innerJoin(journalEntries, eq(journalEntries.id, journalLines.entryId))
    .innerJoin(chartOfAccounts, eq(chartOfAccounts.id, journalLines.accountId))
    .leftJoin(branches, eq(branches.id, journalLines.branchId))
    .where(eq(journalEntries.batchId, batchId))
    .orderBy(asc(journalEntries.entryDate), asc(journalEntries.id), asc(journalLines.id));
}

export async function getJournalBatchReportMetaRepo(batchId: string) {
  const postedByUser = alias(users, 'report_journal_batch_posted_by');

  const [row] = await db
    .select({
      id: journalBatches.id,
      sourceType: journalBatches.sourceType,
      sourceId: journalBatches.sourceId,
      batchDate: journalBatches.batchDate,
      description: journalBatches.description,
      postedAt: journalBatches.postedAt,
      postedBy: journalBatches.postedBy,
      postedByName: postedByUser.fullname,
    })
    .from(journalBatches)
    .leftJoin(postedByUser, eq(postedByUser.id, journalBatches.postedBy))
    .where(eq(journalBatches.id, batchId))
    .limit(1);

  return row ?? null;
}

export async function listDeliveryPerformanceReportRowsRepo(input: {
  companyId: string;
  branchId?: string | null;
  riderUserId?: string | null;
  from: Date;
  to: Date;
}) {
  const receiver = alias(customers, 'report_delivery_receiver');
  const destinationBranch = alias(branches, 'report_delivery_destination_branch');
  const rider = alias(users, 'report_delivery_rider');

  return db
    .select({
      deliveryId: deliveries.id,
      parcelId: deliveries.parcelId,
      mode: deliveries.mode,
      deliveryStatus: deliveries.status,
      parcelStatus: parcels.status,
      riderUserId: deliveries.riderUserId,
      riderName: rider.fullname,
      destinationBranchId: parcels.destinationId,
      destinationBranchName: destinationBranch.name,
      receiverName: receiver.fullname,
      receiverPhone: receiver.telephone,
      trackingCode: parcels.trackingCode,
      bookingCode: parcels.bookingCode,
      deliveryFeePsw: deliveries.chargePsw,
      amountPaidPsw: deliveries.amountPaidPsw,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
      dropoffAddress: deliveries.dropoffAddress,
      deliveredAt: deliveries.deliveredAt,
      createdAt: deliveries.createdAt,
      updatedAt: deliveries.updatedAt,
    })
    .from(deliveries)
    .innerJoin(parcels, eq(parcels.id, deliveries.parcelId))
    .leftJoin(receiver, eq(receiver.id, parcels.receiverId))
    .leftJoin(destinationBranch, eq(destinationBranch.id, parcels.destinationId))
    .leftJoin(rider, eq(rider.id, deliveries.riderUserId))
    .where(
      and(
        eq(parcels.companyId, input.companyId),
        eq(deliveries.isDeleted, false),
        gte(deliveries.createdAt, input.from),
        lte(deliveries.createdAt, input.to),
        ...(input.branchId ? [eq(parcels.destinationId, input.branchId)] : []),
        ...(input.riderUserId ? [eq(deliveries.riderUserId, input.riderUserId)] : []),
      ),
    )
    .orderBy(desc(deliveries.updatedAt), asc(deliveries.id));
}

export type CashierSessionTransactionRow = {
  sessionId: string | null;
  paymentId: string;
  parcelId: string;
  trackingCode: string;
  method: number;
  component: number;
  payer: number;
  cashierType: number;
  grossAmountPsw: number;
  netAmountPsw: number;
  taxTotalPsw: number;
  receivedAt: Date;
  receiptNo: string | null;
};

export type DailyCashierSalesSessionRow = {
  id: string;
  cashierId: string;
  cashierName: string;
  branchId: string;
  branchName: string;
  locationId: string | null;
  locationName: string | null;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  actualStartTime: Date | null;
  actualEndTime: Date | null;
  status: string;
  openingBalancePsw: number;
  closingBalancePsw: number | null;
};

export type DailyCashierSalesTransactionRow = {
  sessionId: string;
  paymentId: string;
  parcelId: string;
  bookingCode: string;
  trackingCode: string;
  parcelDetails: string;
  parcelContent: string;
  senderName: string | null;
  senderTelephone: string | null;
  receiverName: string | null;
  receiverTelephone: string | null;
  cashierType: number;
  method: number;
  component: number;
  payer: number;
  grossAmountPsw: number;
  netAmountPsw: number;
  taxTotalPsw: number;
  receivedAt: Date;
  receiptNo: string | null;
};

export type DailyCashierSalesToBePaidRow = {
  parcelId: string;
  sessionId: string | null;
  bookingCode: string;
  parcelDetails: string;
  parcelContent: string;
  senderName: string | null;
  senderTelephone: string | null;
  receiverName: string | null;
  receiverTelephone: string | null;
  plannedToBePaidPsw: number;
  createdAt: Date;
};

export async function listCashierSessionsForDayRepo(input: {
  companyId: string;
  cashierId: string;
  date: Date;
  branchId?: string | null;
}): Promise<CashierSessionReportRow[]> {
  const dayStart = new Date(input.date);
  dayStart.setHours(0, 0, 0, 0);
  const nextDayStart = new Date(dayStart);
  nextDayStart.setDate(nextDayStart.getDate() + 1);

  const where = [
    eq(cashierSessions.cashierId, input.cashierId),
    eq(users.companyId, input.companyId),
    gte(cashierSessions.scheduledStartTime, dayStart),
    lt(cashierSessions.scheduledStartTime, nextDayStart),
  ];

  if (input.branchId) {
    where.push(eq(cashierSessions.branchId, input.branchId));
  }

  return db
    .select({
      id: cashierSessions.id,
      cashierId: cashierSessions.cashierId,
      branchId: cashierSessions.branchId,
      scheduledStartTime: cashierSessions.scheduledStartTime,
      actualEndTime: cashierSessions.actualEndTime,
      openingBalancePsw: cashierSessions.openingBalancePsw,
      closingBalancePsw: cashierSessions.closingBalancePsw,
      status: cashierSessions.status,
    })
    .from(cashierSessions)
    .innerJoin(users, eq(users.id, cashierSessions.cashierId))
    .where(and(...where))
    .orderBy(desc(cashierSessions.scheduledStartTime), desc(cashierSessions.id));
}

export async function listSessionTransactionsRepo(
  sessionIds: string[],
): Promise<CashierSessionTransactionRow[]> {
  if (!sessionIds.length) return [];

  return db
    .select({
      sessionId: parcels.cashierSessionId,
      paymentId: payments.id,
      parcelId: payments.parcelId,
      trackingCode: parcels.trackingCode,
      method: payments.method,
      component: payments.component,
      payer: payments.payer,
      cashierType: payments.cashierType,
      grossAmountPsw: payments.grossAmountPsw,
      netAmountPsw: payments.netAmountPsw,
      taxTotalPsw: payments.taxTotalPsw,
      receivedAt: payments.receivedAt,
      receiptNo: payments.receiptNo,
    })
    .from(payments)
    .innerJoin(parcels, eq(parcels.id, payments.parcelId))
    .where(and(inArray(parcels.cashierSessionId, sessionIds), isNull(payments.voidedAt)))
    .orderBy(asc(payments.receivedAt), asc(payments.id));
}

export async function listDailyCashierSalesSessionsRepo(input: {
  companyId: string;
  date: Date;
  branchId?: string | null;
  locationId?: string | null;
}): Promise<DailyCashierSalesSessionRow[]> {
  const dayStart = new Date(input.date);
  dayStart.setHours(0, 0, 0, 0);
  const nextDayStart = new Date(dayStart);
  nextDayStart.setDate(nextDayStart.getDate() + 1);

  return db
    .select({
      id: cashierSessions.id,
      cashierId: cashierSessions.cashierId,
      cashierName: users.fullname,
      branchId: cashierSessions.branchId,
      branchName: branches.name,
      locationId: users.locationId,
      locationName: locations.name,
      scheduledStartTime: cashierSessions.scheduledStartTime,
      scheduledEndTime: cashierSessions.scheduledEndTime,
      actualStartTime: cashierSessions.actualStartTime,
      actualEndTime: cashierSessions.actualEndTime,
      status: cashierSessions.status,
      openingBalancePsw: cashierSessions.openingBalancePsw,
      closingBalancePsw: cashierSessions.closingBalancePsw,
    })
    .from(cashierSessions)
    .innerJoin(users, eq(users.id, cashierSessions.cashierId))
    .innerJoin(branches, eq(branches.id, cashierSessions.branchId))
    .leftJoin(locations, eq(locations.id, users.locationId))
    .where(
      and(
        eq(users.companyId, input.companyId),
        or(
          and(
            isNotNull(cashierSessions.actualStartTime),
            gte(cashierSessions.actualStartTime, dayStart),
            lt(cashierSessions.actualStartTime, nextDayStart),
          ),
          and(
            isNull(cashierSessions.actualStartTime),
            gte(cashierSessions.scheduledStartTime, dayStart),
            lt(cashierSessions.scheduledStartTime, nextDayStart),
          ),
        ),
        ...(input.branchId ? [eq(cashierSessions.branchId, input.branchId)] : []),
        ...(input.locationId ? [eq(users.locationId, input.locationId)] : []),
      ),
    )
    .orderBy(desc(cashierSessions.scheduledStartTime), desc(cashierSessions.id));
}

export async function listDailyCashierSalesTransactionsRepo(input: {
  sessionIds: string[];
  cashierType?: number | null;
}): Promise<DailyCashierSalesTransactionRow[]> {
  if (!input.sessionIds.length) return [];

  const sender = alias(customers, 'daily_cashier_sales_sender');
  const receiver = alias(customers, 'daily_cashier_sales_receiver');
  const cashierTypeFilter =
    input.cashierType === CashierType.FULL
      ? [inArray(payments.cashierType, [CashierType.SENDING, CashierType.TOBEPAID])]
      : input.cashierType !== null && input.cashierType !== undefined
        ? [eq(payments.cashierType, input.cashierType)]
        : [];

  return db
    .select({
      sessionId: cashierSessions.id,
      paymentId: payments.id,
      parcelId: payments.parcelId,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      parcelDetails: parcels.parcelDetails,
      parcelContent: parcels.parcelContent,
      senderName: sender.fullname,
      senderTelephone: sender.telephone,
      receiverName: receiver.fullname,
      receiverTelephone: receiver.telephone,
      cashierType: payments.cashierType,
      method: payments.method,
      component: payments.component,
      payer: payments.payer,
      grossAmountPsw: payments.grossAmountPsw,
      netAmountPsw: payments.netAmountPsw,
      taxTotalPsw: payments.taxTotalPsw,
      receivedAt: payments.receivedAt,
      receiptNo: payments.receiptNo,
    })
    .from(payments)
    .innerJoin(cashierSessions, eq(cashierSessions.cashierId, payments.cashierUserId))
    .innerJoin(parcels, eq(parcels.id, payments.parcelId))
    .leftJoin(sender, eq(sender.id, parcels.senderId))
    .leftJoin(receiver, eq(receiver.id, parcels.receiverId))
    .where(
      and(
        inArray(cashierSessions.id, input.sessionIds),
        eq(payments.branchId, cashierSessions.branchId),
        gte(
          payments.receivedAt,
          sql<Date>`coalesce(${cashierSessions.actualStartTime}, ${cashierSessions.scheduledStartTime})`,
        ),
        or(
          isNull(cashierSessions.actualEndTime),
          lte(payments.receivedAt, cashierSessions.actualEndTime),
        ),
        isNull(payments.voidedAt),
        ...cashierTypeFilter,
      ),
    )
    .orderBy(asc(payments.receivedAt), asc(payments.id));
}

export async function listDailyCashierSalesToBePaidRowsRepo(input: {
  companyId: string;
  date: Date;
  branchId?: string | null;
  locationId?: string | null;
  cashierUserId?: string | null;
}): Promise<DailyCashierSalesToBePaidRow[]> {
  const dayStart = new Date(input.date);
  dayStart.setHours(0, 0, 0, 0);
  const nextDayStart = new Date(dayStart);
  nextDayStart.setDate(nextDayStart.getDate() + 1);

  const sender = alias(customers, 'daily_cashier_sales_tbp_sender');
  const receiver = alias(customers, 'daily_cashier_sales_tbp_receiver');

  return db
    .select({
      parcelId: parcels.id,
      sessionId: parcels.cashierSessionId,
      bookingCode: parcels.bookingCode,
      parcelDetails: parcels.parcelDetails,
      parcelContent: parcels.parcelContent,
      senderName: sender.fullname,
      senderTelephone: sender.telephone,
      receiverName: receiver.fullname,
      receiverTelephone: receiver.telephone,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
      createdAt: parcels.createdAt,
    })
    .from(parcels)
    .leftJoin(sender, eq(sender.id, parcels.senderId))
    .leftJoin(receiver, eq(receiver.id, parcels.receiverId))
    .where(
      and(
        eq(parcels.companyId, input.companyId),
        gte(parcels.createdAt, dayStart),
        lt(parcels.createdAt, nextDayStart),
        sql`${parcels.plannedToBePaidPsw} > 0`,
        eq(parcels.isDeleted, false),
        ...(input.branchId ? [eq(parcels.sourceId, input.branchId)] : []),
        ...(input.locationId ? [eq(parcels.sourceLocationId, input.locationId)] : []),
        ...(input.cashierUserId ? [eq(parcels.createdBy, input.cashierUserId)] : []),
      ),
    )
    .orderBy(asc(parcels.createdAt), asc(parcels.id));
}

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

export async function listEmployeeMasterReportRowsRepo(input: {
  companyId: string;
  branchId?: string | null;
  departmentId?: string | null;
  status?: number | null;
  search?: string | null;
}) {
  const where = [
    eq(employees.companyId, input.companyId),
    eq(employees.isDeleted, false),
    ...(input.branchId ? [eq(employees.branchId, input.branchId)] : []),
    ...(input.departmentId ? [eq(employees.departmentId, input.departmentId)] : []),
    ...(input.status !== null && input.status !== undefined
      ? [eq(employees.employmentStatus, input.status)]
      : []),
    ...(input.search
      ? [
          or(
            ilike(employees.displayName, `%${input.search}%`),
            ilike(employees.employeeNumber, `%${input.search}%`),
            ilike(employees.email, `%${input.search}%`),
            ilike(employees.telephone, `%${input.search}%`),
          )!,
        ]
      : []),
  ];

  const manager = alias(employees, 'report_employee_manager');

  return db
    .select({
      id: employees.id,
      employeeNumber: employees.employeeNumber,
      displayName: employees.displayName,
      email: employees.email,
      telephone: employees.telephone,
      employmentStatus: employees.employmentStatus,
      employmentType: employees.employmentType,
      hireDate: employees.hireDate,
      branchId: employees.branchId,
      branchName: branches.name,
      locationId: employees.locationId,
      locationName: locations.name,
      departmentId: employees.departmentId,
      departmentName: departments.name,
      jobTitleId: employees.jobTitleId,
      jobTitleName: jobTitles.name,
      supervisorEmployeeId: sql<
        string | null
      >`coalesce(${employees.officerEmployeeId}, ${employees.managerEmployeeId})`,
      supervisorName: manager.displayName,
      hasUserAccount: employees.hasUserAccount,
      paymentMethod: sql<string | null>`NULL`,
      bankName: sql<string | null>`NULL`,
      mobileMoneyNumber: sql<string | null>`NULL`,
      createdAt: employees.createdAt,
    })
    .from(employees)
    .leftJoin(branches, eq(branches.id, employees.branchId))
    .leftJoin(locations, eq(locations.id, employees.locationId))
    .leftJoin(departments, eq(departments.id, employees.departmentId))
    .leftJoin(jobTitles, eq(jobTitles.id, employees.jobTitleId))
    .leftJoin(
      manager,
      sql`${manager.id} = coalesce(${employees.officerEmployeeId}, ${employees.managerEmployeeId})`,
    )
    .where(and(...where))
    .orderBy(asc(employees.displayName), asc(employees.id));
}

export async function listAttendanceReportRowsRepo(input: {
  companyId: string;
  from: Date;
  to: Date;
  employeeId?: string | null;
  branchId?: string | null;
}) {
  return db
    .select({
      id: attendanceRecords.id,
      employeeId: attendanceRecords.employeeId,
      employeeNumber: employees.employeeNumber,
      employeeName: employees.displayName,
      branchId: attendanceRecords.branchId,
      branchName: branches.name,
      locationId: attendanceRecords.locationId,
      locationName: locations.name,
      attendanceDate: attendanceRecords.attendanceDate,
      checkInAt: attendanceRecords.checkInAt,
      checkOutAt: attendanceRecords.checkOutAt,
      minutesWorked: attendanceRecords.minutesWorked,
      status: attendanceRecords.status,
      createdAt: attendanceRecords.createdAt,
    })
    .from(attendanceRecords)
    .leftJoin(employees, eq(employees.id, attendanceRecords.employeeId))
    .leftJoin(branches, eq(branches.id, attendanceRecords.branchId))
    .leftJoin(locations, eq(locations.id, attendanceRecords.locationId))
    .where(
      and(
        eq(attendanceRecords.companyId, input.companyId),
        gte(attendanceRecords.attendanceDate, input.from),
        lte(attendanceRecords.attendanceDate, input.to),
        ...(input.employeeId ? [eq(attendanceRecords.employeeId, input.employeeId)] : []),
        ...(input.branchId ? [eq(attendanceRecords.branchId, input.branchId)] : []),
      ),
    )
    .orderBy(desc(attendanceRecords.attendanceDate), asc(employees.displayName), asc(employees.id));
}

export async function listLeaveRequestReportRowsRepo(input: {
  companyId: string;
  from: Date;
  to: Date;
  employeeId?: string | null;
  status?: number | null;
}) {
  return db
    .select({
      id: leaveRequests.id,
      employeeId: leaveRequests.employeeId,
      employeeNumber: employees.employeeNumber,
      employeeName: employees.displayName,
      supervisorEmployeeId: sql<
        string | null
      >`coalesce(${employees.officerEmployeeId}, ${employees.managerEmployeeId})`,
      leaveTypeId: leaveRequests.leaveTypeId,
      leaveTypeName: leaveTypes.name,
      leaveTypeIsPaid: leaveTypes.isPaid,
      dateFrom: leaveRequests.dateFrom,
      dateTo: leaveRequests.dateTo,
      daysCount: leaveRequests.daysCount,
      managerApprovalStatus: leaveRequests.managerApprovalStatus,
      status: leaveRequests.status,
      reason: leaveRequests.reason,
      rejectionReason: leaveRequests.rejectionReason,
      approvedAt: leaveRequests.approvedAt,
      createdAt: leaveRequests.createdAt,
    })
    .from(leaveRequests)
    .innerJoin(employees, eq(employees.id, leaveRequests.employeeId))
    .innerJoin(leaveTypes, eq(leaveTypes.id, leaveRequests.leaveTypeId))
    .where(
      and(
        eq(leaveRequests.companyId, input.companyId),
        lte(leaveRequests.dateFrom, input.to),
        gte(leaveRequests.dateTo, input.from),
        ...(input.employeeId ? [eq(leaveRequests.employeeId, input.employeeId)] : []),
        ...(input.status !== null && input.status !== undefined
          ? [eq(leaveRequests.status, input.status)]
          : []),
      ),
    )
    .orderBy(desc(leaveRequests.dateFrom), asc(employees.displayName), asc(employees.id));
}

export async function findLatestPayrollRunForCycleRepo(input: {
  companyId: string;
  payrollCycleId: string;
}) {
  const [row] = await db
    .select({
      id: payrollRuns.id,
      payrollCycleId: payrollRuns.payrollPeriodId,
      status: payrollRuns.status,
      approvedAt: payrollRuns.approvedAt,
      createdAt: payrollRuns.createdAt,
    })
    .from(payrollRuns)
    .where(
      and(
        eq(payrollRuns.companyId, input.companyId),
        eq(payrollRuns.payrollPeriodId, input.payrollCycleId),
      ),
    )
    .orderBy(desc(payrollRuns.createdAt), desc(payrollRuns.id))
    .limit(1);

  return row ?? null;
}

export async function listPayrollRegisterRowsRepo(input: { payrollRunId: string }) {
  return db
    .select({
      id: payrollRunEmployees.id,
      payrollRunId: payrollRunEmployees.payrollRunId,
      employeeId: payrollRunEmployees.employeeId,
      employeeNumber: payrollRunEmployees.employeeNumberSnapshot,
      employeeName: payrollRunEmployees.employeeNameSnapshot,
      branchId: payrollRunEmployees.branchIdSnapshot,
      branchName: branches.name,
      departmentName: payrollRunEmployees.departmentNameSnapshot,
      jobTitleName: payrollRunEmployees.jobTitleNameSnapshot,
      basePayPsw: payrollRunEmployees.basePayPsw,
      grossPayPsw: payrollRunEmployees.grossPayPsw,
      totalDeductionsPsw: payrollRunEmployees.totalDeductionsPsw,
      netPayPsw: payrollRunEmployees.netPayPsw,
      currencyCode: payrollRunEmployees.currencyCode,
      status: payrollRunEmployees.status,
    })
    .from(payrollRunEmployees)
    .leftJoin(branches, eq(branches.id, payrollRunEmployees.branchIdSnapshot))
    .where(eq(payrollRunEmployees.payrollRunId, input.payrollRunId))
    .orderBy(asc(payrollRunEmployees.employeeNameSnapshot), asc(payrollRunEmployees.id));
}

export async function listPayrollOvertimeReportRowsRepo(input: {
  companyId: string;
  payrollCycleId: string;
}) {
  return db
    .select({
      id: payrollOvertimeEntries.id,
      employeeId: payrollOvertimeEntries.employeeId,
      employeeNumber: employees.employeeNumber,
      employeeName: employees.displayName,
      branchId: employees.branchId,
      branchName: branches.name,
      departmentName: departments.name,
      overtimeMinutes: payrollOvertimeEntries.overtimeMinutes,
      ratePerHourPsw: payrollOvertimeEntries.ratePerHourPsw,
      multiplierPct: payrollOvertimeEntries.multiplierPct,
      approvalStatus: payrollOvertimeEntries.approvalStatus,
      approvedAt: payrollOvertimeEntries.approvedAt,
      notes: payrollOvertimeEntries.notes,
      createdAt: payrollOvertimeEntries.createdAt,
    })
    .from(payrollOvertimeEntries)
    .innerJoin(employees, eq(employees.id, payrollOvertimeEntries.employeeId))
    .leftJoin(branches, eq(branches.id, employees.branchId))
    .leftJoin(departments, eq(departments.id, employees.departmentId))
    .where(
      and(
        eq(payrollOvertimeEntries.companyId, input.companyId),
        eq(payrollOvertimeEntries.payrollPeriodId, input.payrollCycleId),
      ),
    )
    .orderBy(desc(payrollOvertimeEntries.createdAt), asc(employees.displayName), asc(employees.id));
}

export async function listPayrollAdjustmentReportRowsRepo(input: {
  companyId: string;
  payrollCycleId: string;
}) {
  return db
    .select({
      id: payrollManualAdjustments.id,
      employeeId: payrollManualAdjustments.employeeId,
      employeeNumber: employees.employeeNumber,
      employeeName: employees.displayName,
      branchId: employees.branchId,
      branchName: branches.name,
      departmentName: departments.name,
      itemType: payrollManualAdjustments.itemType,
      code: payrollManualAdjustments.code,
      name: payrollManualAdjustments.name,
      amountPsw: payrollManualAdjustments.amountPsw,
      isTaxable: payrollManualAdjustments.isTaxable,
      approvalStatus: payrollManualAdjustments.approvalStatus,
      approvedAt: payrollManualAdjustments.approvedAt,
      notes: payrollManualAdjustments.notes,
      createdAt: payrollManualAdjustments.createdAt,
    })
    .from(payrollManualAdjustments)
    .innerJoin(employees, eq(employees.id, payrollManualAdjustments.employeeId))
    .leftJoin(branches, eq(branches.id, employees.branchId))
    .leftJoin(departments, eq(departments.id, employees.departmentId))
    .where(
      and(
        eq(payrollManualAdjustments.companyId, input.companyId),
        eq(payrollManualAdjustments.payrollPeriodId, input.payrollCycleId),
      ),
    )
    .orderBy(
      desc(payrollManualAdjustments.createdAt),
      asc(employees.displayName),
      asc(employees.id),
    );
}

export async function getPayrollCycleRepo(input: { companyId: string; payrollCycleId: string }) {
  const [row] = await db
    .select({
      id: payrollPeriods.id,
      name: payrollPeriods.name,
      periodStart: payrollPeriods.periodStart,
      periodEnd: payrollPeriods.periodEnd,
      paymentDate: payrollPeriods.paymentDate,
      status: payrollPeriods.status,
    })
    .from(payrollPeriods)
    .where(
      and(
        eq(payrollPeriods.companyId, input.companyId),
        eq(payrollPeriods.id, input.payrollCycleId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listParcelStatusReportRowsRepo(input: {
  companyId: string;
  from?: Date | null;
  to?: Date | null;
  branchId?: string | null;
}) {
  return db
    .select({
      id: parcels.id,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      status: parcels.status,
      parcelDetails: parcels.parcelDetails,
      parcelContent: parcels.parcelContent,
      chargePsw: parcels.chargePsw,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
      sourceBranchId: parcels.sourceId,
      sourceBranchName: sourceBranch.name,
      destinationBranchId: parcels.destinationId,
      destinationBranchName: destinationBranch.name,
      senderName: sender.fullname,
      receiverName: receiver.fullname,
      createdAt: parcels.createdAt,
      receivedAt: parcels.receivedAt,
    })
    .from(parcels)
    .leftJoin(sourceBranch, eq(sourceBranch.id, parcels.sourceId))
    .leftJoin(destinationBranch, eq(destinationBranch.id, parcels.destinationId))
    .leftJoin(sender, eq(sender.id, parcels.senderId))
    .leftJoin(receiver, eq(receiver.id, parcels.receiverId))
    .where(
      and(
        eq(parcels.companyId, input.companyId),
        eq(parcels.isDeleted, false),
        ...(input.from ? [gte(parcels.createdAt, input.from)] : []),
        ...(input.to ? [lte(parcels.createdAt, input.to)] : []),
        ...(input.branchId
          ? [or(eq(parcels.sourceId, input.branchId), eq(parcels.destinationId, input.branchId))!]
          : []),
      ),
    )
    .orderBy(desc(parcels.createdAt), desc(parcels.id));
}

export type StorageWaiverFinancialReportRow = {
  waiverId: string;
  parcelId: string;
  bookingCode: string;
  trackingCode: string;
  destinationBranchId: string;
  destinationBranchName: string | null;
  waivedAmountPsw: number;
  reason: string;
  waivedByUserId: string;
  waivedByName: string | null;
  waivedAt: Date;
  accountingJournalEntryId: string | null;
  accountingPostedAt: Date | null;
};

export async function listStorageWaiverFinancialReportRowsRepo(input: {
  companyId: string;
  from: Date;
  to: Date;
  branchId?: string | null;
}) {
  const waivedBy = alias(users, 'report_storage_waived_by');
  const destination = alias(branches, 'report_storage_destination');

  return db
    .select({
      waiverId: parcelStorageWaivers.id,
      parcelId: parcelStorageWaivers.parcelId,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      destinationBranchId: parcels.destinationId,
      destinationBranchName: destination.name,
      waivedAmountPsw: parcelStorageWaivers.waivedAmountPsw,
      reason: parcelStorageWaivers.reason,
      waivedByUserId: parcelStorageWaivers.waivedBy,
      waivedByName: waivedBy.fullname,
      waivedAt: parcelStorageWaivers.waivedAt,
      accountingJournalEntryId: parcelStorageWaivers.accountingJournalEntryId,
      accountingPostedAt: parcelStorageWaivers.accountingPostedAt,
    })
    .from(parcelStorageWaivers)
    .innerJoin(parcels, eq(parcels.id, parcelStorageWaivers.parcelId))
    .leftJoin(waivedBy, eq(waivedBy.id, parcelStorageWaivers.waivedBy))
    .leftJoin(destination, eq(destination.id, parcels.destinationId))
    .where(
      and(
        eq(parcelStorageWaivers.companyId, input.companyId),
        gte(parcelStorageWaivers.waivedAt, input.from),
        lte(parcelStorageWaivers.waivedAt, input.to),
        ...(input.branchId ? [eq(parcels.destinationId, input.branchId)] : []),
      ),
    )
    .orderBy(desc(parcelStorageWaivers.waivedAt), desc(parcelStorageWaivers.id));
}

export async function listShiftRevenueSessionsRepo(input: {
  companyId: string;
  branchId?: string | null;
  shiftSessionId?: string | null;
  from: Date;
  to: Date;
}) {
  return db
    .select({
      id: cashierSessions.id,
      cashierId: cashierSessions.cashierId,
      cashierName: users.fullname,
      branchId: cashierSessions.branchId,
      branchName: branches.name,
      shiftTypeId: cashierSessions.shiftTypeId,
      shiftTypeName: shiftTypes.name,
      scheduledStartTime: cashierSessions.scheduledStartTime,
      scheduledEndTime: cashierSessions.scheduledEndTime,
      actualStartTime: cashierSessions.actualStartTime,
      actualEndTime: cashierSessions.actualEndTime,
      status: cashierSessions.status,
      openingBalancePsw: cashierSessions.openingBalancePsw,
      closingBalancePsw: cashierSessions.closingBalancePsw,
      totalTransactions: cashierSessions.totalTransactions,
    })
    .from(cashierSessions)
    .innerJoin(users, eq(users.id, cashierSessions.cashierId))
    .innerJoin(branches, eq(branches.id, cashierSessions.branchId))
    .leftJoin(shiftTypes, eq(shiftTypes.id, cashierSessions.shiftTypeId))
    .where(
      and(
        eq(users.companyId, input.companyId),
        gte(cashierSessions.scheduledStartTime, input.from),
        lte(cashierSessions.scheduledStartTime, input.to),
        ...(input.branchId ? [eq(cashierSessions.branchId, input.branchId)] : []),
        ...(input.shiftSessionId ? [eq(cashierSessions.id, input.shiftSessionId)] : []),
      ),
    )
    .orderBy(desc(cashierSessions.scheduledStartTime), desc(cashierSessions.id));
}

export async function listShiftRevenueTransactionRowsRepo(sessionIds: string[]) {
  if (!sessionIds.length) return [];

  return db
    .select({
      sessionId: parcels.cashierSessionId,
      paymentId: payments.id,
      method: payments.method,
      grossAmountPsw: payments.grossAmountPsw,
      netAmountPsw: payments.netAmountPsw,
      taxTotalPsw: payments.taxTotalPsw,
      receivedAt: payments.receivedAt,
    })
    .from(payments)
    .innerJoin(parcels, eq(parcels.id, payments.parcelId))
    .where(and(inArray(parcels.cashierSessionId, sessionIds), isNull(payments.voidedAt)))
    .orderBy(asc(payments.receivedAt), asc(payments.id));
}

export function categorizeShiftRevenueMethod(method: number, amountPsw: number) {
  if (method === PaymentMethod.CASH) {
    return { cashPsw: amountPsw, mobileMoneyPsw: 0, creditPsw: 0 };
  }
  if (method === PaymentMethod.CREDIT) {
    return { cashPsw: 0, mobileMoneyPsw: 0, creditPsw: amountPsw };
  }
  return { cashPsw: 0, mobileMoneyPsw: amountPsw, creditPsw: 0 };
}

export type CreditExposureReportRow = {
  customerId: string;
  customerName: string;
  telephone: string | null;
  creditLimitPsw: number;
  outstandingPsw: number;
  oldestChargeAt: Date | null;
  bucketCurrentPsw: number;
  bucket1To30Psw: number;
  bucket31To60Psw: number;
  bucket61To90Psw: number;
  bucket91PlusPsw: number;
};

export type CustomerCreditAgingDetailReportRow = {
  customerId: string;
  customerName: string;
  telephone: string | null;
  chargeTransactionId: string;
  chargeCreatedAt: Date;
  sourceType: number;
  referenceId: string | null;
  notes: string | null;
  chargeAmountPsw: number;
  allocatedAmountPsw: number;
  outstandingAmountPsw: number;
  ageDays: number;
  agingBucket: 'current' | '1-30' | '31-60' | '61-90' | '91+';
};

export async function listCreditExposureReportRowsRepo(input: { companyId: string }) {
  const rows = await db.execute(sql<{
    customer_id: string;
    customer_name: string;
    telephone: string | null;
    credit_limit_psw: string | number;
    outstanding_psw: string | number;
    oldest_charge_at: string | Date | null;
    bucket_current_psw: string | number;
    bucket_1_30_psw: string | number;
    bucket_31_60_psw: string | number;
    bucket_61_90_psw: string | number;
    bucket_91_plus_psw: string | number;
  }>`
    WITH charge_rows AS (
      SELECT
        cct.customer_id,
        cct.id AS charge_transaction_id,
        cct.created_at,
        cct.signed_amount_psw::bigint AS charge_amount_psw
      FROM customer_credit_transactions cct
      WHERE cct.company_id = ${input.companyId}
        AND cct.transaction_type = ${CustomerCreditTransactionType.CHARGE}
        AND cct.signed_amount_psw > 0
    ),
    allocations AS (
      SELECT
        cca.charge_transaction_id,
        COALESCE(SUM(cca.amount_psw), 0)::bigint AS allocated_amount_psw
      FROM customer_credit_allocations cca
      WHERE cca.company_id = ${input.companyId}
      GROUP BY cca.charge_transaction_id
    ),
    outstanding AS (
      SELECT
        cr.customer_id,
        cr.created_at,
        (cr.charge_amount_psw - COALESCE(a.allocated_amount_psw, 0))::bigint AS outstanding_amount_psw,
        GREATEST((CURRENT_DATE - cr.created_at::date), 0) AS age_days
      FROM charge_rows cr
      LEFT JOIN allocations a ON a.charge_transaction_id = cr.charge_transaction_id
      WHERE (cr.charge_amount_psw - COALESCE(a.allocated_amount_psw, 0)) > 0
    )
    SELECT
      c.id AS customer_id,
      c.fullname AS customer_name,
      c.telephone,
      c.credit_limit_psw,
      COALESCE(SUM(o.outstanding_amount_psw), 0)::bigint AS outstanding_psw,
      MIN(o.created_at) AS oldest_charge_at,
      COALESCE(SUM(CASE WHEN o.age_days = 0 THEN o.outstanding_amount_psw ELSE 0 END), 0)::bigint AS bucket_current_psw,
      COALESCE(SUM(CASE WHEN o.age_days BETWEEN 1 AND 30 THEN o.outstanding_amount_psw ELSE 0 END), 0)::bigint AS bucket_1_30_psw,
      COALESCE(SUM(CASE WHEN o.age_days BETWEEN 31 AND 60 THEN o.outstanding_amount_psw ELSE 0 END), 0)::bigint AS bucket_31_60_psw,
      COALESCE(SUM(CASE WHEN o.age_days BETWEEN 61 AND 90 THEN o.outstanding_amount_psw ELSE 0 END), 0)::bigint AS bucket_61_90_psw,
      COALESCE(SUM(CASE WHEN o.age_days > 90 THEN o.outstanding_amount_psw ELSE 0 END), 0)::bigint AS bucket_91_plus_psw
    FROM customers c
    INNER JOIN outstanding o ON o.customer_id = c.id
    WHERE c.company_id = ${input.companyId}
      AND c.is_deleted = false
    GROUP BY c.id, c.fullname, c.telephone, c.credit_limit_psw
    ORDER BY outstanding_psw DESC, c.fullname ASC
  `);

  return rows.map((row) => ({
    customerId: row.customer_id,
    customerName: row.customer_name,
    telephone: row.telephone,
    creditLimitPsw: Number(row.credit_limit_psw),
    outstandingPsw: Number(row.outstanding_psw),
    oldestChargeAt:
      row.oldest_charge_at &&
      (typeof row.oldest_charge_at === 'string' || row.oldest_charge_at instanceof Date)
        ? new Date(row.oldest_charge_at)
        : null,
    bucketCurrentPsw: Number(row.bucket_current_psw),
    bucket1To30Psw: Number(row.bucket_1_30_psw),
    bucket31To60Psw: Number(row.bucket_31_60_psw),
    bucket61To90Psw: Number(row.bucket_61_90_psw),
    bucket91PlusPsw: Number(row.bucket_91_plus_psw),
  })) as CreditExposureReportRow[];
}

export async function listCustomerCreditAgingDetailReportRowsRepo(input: {
  companyId: string;
  customerId?: string | null;
  agingBucket?: string | null;
  from?: Date | null;
  to?: Date | null;
}) {
  const rows = await db.execute(sql<{
    customer_id: string;
    customer_name: string;
    telephone: string | null;
    charge_transaction_id: string;
    charge_created_at: string | Date;
    source_type: number;
    reference_id: string | null;
    notes: string | null;
    charge_amount_psw: string | number;
    allocated_amount_psw: string | number;
    outstanding_amount_psw: string | number;
    age_days: number;
    aging_bucket: 'current' | '1-30' | '31-60' | '61-90' | '91+';
  }>`
    WITH charge_rows AS (
      SELECT
        cct.id AS charge_transaction_id,
        cct.customer_id,
        cct.created_at,
        cct.source_type,
        cct.reference_id,
        cct.notes,
        cct.signed_amount_psw::bigint AS charge_amount_psw
      FROM customer_credit_transactions cct
      WHERE cct.company_id = ${input.companyId}
        AND cct.transaction_type = ${CustomerCreditTransactionType.CHARGE}
        AND cct.signed_amount_psw > 0
        ${input.customerId ? sql`AND cct.customer_id = ${input.customerId}` : sql``}
        ${input.from ? sql`AND cct.created_at >= ${input.from}` : sql``}
        ${input.to ? sql`AND cct.created_at <= ${input.to}` : sql``}
    ),
    allocations AS (
      SELECT
        cca.charge_transaction_id,
        COALESCE(SUM(cca.amount_psw), 0)::bigint AS allocated_amount_psw
      FROM customer_credit_allocations cca
      WHERE cca.company_id = ${input.companyId}
      GROUP BY cca.charge_transaction_id
    ),
    outstanding AS (
      SELECT
        cr.customer_id,
        cr.charge_transaction_id,
        cr.created_at,
        cr.source_type,
        cr.reference_id,
        cr.notes,
        cr.charge_amount_psw,
        COALESCE(a.allocated_amount_psw, 0)::bigint AS allocated_amount_psw,
        (cr.charge_amount_psw - COALESCE(a.allocated_amount_psw, 0))::bigint AS outstanding_amount_psw,
        GREATEST((CURRENT_DATE - cr.created_at::date), 0) AS age_days
      FROM charge_rows cr
      LEFT JOIN allocations a ON a.charge_transaction_id = cr.charge_transaction_id
      WHERE (cr.charge_amount_psw - COALESCE(a.allocated_amount_psw, 0)) > 0
    )
    SELECT
      c.id AS customer_id,
      c.fullname AS customer_name,
      c.telephone,
      o.charge_transaction_id,
      o.created_at AS charge_created_at,
      o.source_type,
      o.reference_id,
      o.notes,
      o.charge_amount_psw,
      o.allocated_amount_psw,
      o.outstanding_amount_psw,
      o.age_days,
      CASE
        WHEN o.age_days = 0 THEN 'current'
        WHEN o.age_days BETWEEN 1 AND 30 THEN '1-30'
        WHEN o.age_days BETWEEN 31 AND 60 THEN '31-60'
        WHEN o.age_days BETWEEN 61 AND 90 THEN '61-90'
        ELSE '91+'
      END AS aging_bucket
    FROM outstanding o
    INNER JOIN customers c ON c.id = o.customer_id
    WHERE c.company_id = ${input.companyId}
      AND c.is_deleted = false
      ${
        input.agingBucket
          ? sql`AND CASE
              WHEN o.age_days = 0 THEN 'current'
              WHEN o.age_days BETWEEN 1 AND 30 THEN '1-30'
              WHEN o.age_days BETWEEN 31 AND 60 THEN '31-60'
              WHEN o.age_days BETWEEN 61 AND 90 THEN '61-90'
              ELSE '91+'
            END = ${input.agingBucket}`
          : sql``
      }
    ORDER BY o.age_days DESC, o.created_at ASC, c.fullname ASC
  `);

  return rows.map((row) => ({
    customerId: row.customer_id,
    customerName: row.customer_name,
    telephone: row.telephone,
    chargeTransactionId: row.charge_transaction_id,
    chargeCreatedAt:
      typeof row.charge_created_at === 'string' || row.charge_created_at instanceof Date
        ? new Date(row.charge_created_at)
        : new Date(String(row.charge_created_at)),
    sourceType: Number(row.source_type),
    referenceId: row.reference_id,
    notes: row.notes,
    chargeAmountPsw: Number(row.charge_amount_psw),
    allocatedAmountPsw: Number(row.allocated_amount_psw),
    outstandingAmountPsw: Number(row.outstanding_amount_psw),
    ageDays: Number(row.age_days),
    agingBucket: row.aging_bucket,
  })) as CustomerCreditAgingDetailReportRow[];
}

export type ToBePaidOutstandingReportRow = {
  parcelId: string;
  bookingCode: string;
  trackingCode: string;
  createdAt: Date;
  status: number;
  sourceBranchId: string;
  sourceBranchName: string | null;
  destinationBranchId: string;
  destinationBranchName: string | null;
  senderName: string | null;
  receiverName: string | null;
  plannedToBePaidPsw: number;
  paidPrincipalPsw: number;
  outstandingPsw: number;
};

export type ToBePaidCollectionsReconciliationReportRow = {
  parcelId: string;
  bookingCode: string;
  trackingCode: string;
  createdAt: Date;
  status: number;
  sourceBranchId: string;
  sourceBranchName: string | null;
  destinationBranchId: string;
  destinationBranchName: string | null;
  senderName: string | null;
  receiverName: string | null;
  plannedToBePaidPsw: number;
  collectedPrincipalPsw: number;
  creditedPrincipalPsw: number;
  recognizedPrincipalPsw: number;
  outstandingPsw: number;
  variancePsw: number;
};

export async function listToBePaidOutstandingReportRowsRepo(input: {
  companyId: string;
  sourceBranchId?: string | null;
  destinationBranchId?: string | null;
  from?: Date | null;
  to?: Date | null;
}) {
  const fromParam = input.from ? input.from.toISOString() : null;
  const toParam = input.to ? input.to.toISOString() : null;

  const rows = await db.execute(sql<{
    parcel_id: string;
    booking_code: string;
    tracking_code: string;
    created_at: string | Date;
    status: number;
    source_branch_id: string;
    source_branch_name: string | null;
    destination_branch_id: string;
    destination_branch_name: string | null;
    sender_name: string | null;
    receiver_name: string | null;
    planned_tobepaid_psw: string | number;
    paid_principal_psw: string | number;
    outstanding_psw: string | number;
  }>`
    WITH principal_payments AS (
      SELECT
        p.parcel_id,
        COALESCE(SUM(p.gross_amount_psw), 0)::bigint AS paid_principal_psw
      FROM payments p
      WHERE p.company_id = ${input.companyId}
        AND p.component = ${PaymentComponent.PRINCIPAL}
        AND p.voided_at IS NULL
      GROUP BY p.parcel_id
    )
    SELECT
      pr.id AS parcel_id,
      pr.booking_code,
      pr.tracking_code,
      pr.created_at,
      pr.status,
      pr.source_id AS source_branch_id,
      sb.name AS source_branch_name,
      pr.destination_id AS destination_branch_id,
      dbb.name AS destination_branch_name,
      s.fullname AS sender_name,
      r.fullname AS receiver_name,
      pr.planned_tobepaid_psw,
      COALESCE(pp.paid_principal_psw, 0)::bigint AS paid_principal_psw,
      GREATEST(pr.planned_tobepaid_psw - COALESCE(pp.paid_principal_psw, 0), 0)::bigint AS outstanding_psw
    FROM parcels pr
    LEFT JOIN principal_payments pp ON pp.parcel_id = pr.id
    LEFT JOIN branches sb ON sb.id = pr.source_id
    LEFT JOIN branches dbb ON dbb.id = pr.destination_id
    LEFT JOIN customers s ON s.id = pr.sender_id
    LEFT JOIN customers r ON r.id = pr.receiver_id
    WHERE pr.company_id = ${input.companyId}
      AND pr.is_deleted = false
      AND pr.planned_tobepaid_psw > 0
      AND pr.status NOT IN (${ParcelStatus.DELIVERED_BY_OFFICE}, ${ParcelStatus.DELIVERED_AT_HOME}, ${ParcelStatus.RETURNED_TO_SENDER}, ${ParcelStatus.CANCELLED})
      AND GREATEST(pr.planned_tobepaid_psw - COALESCE(pp.paid_principal_psw, 0), 0) > 0
      ${input.sourceBranchId ? sql`AND pr.source_id = ${input.sourceBranchId}` : sql``}
      ${input.destinationBranchId ? sql`AND pr.destination_id = ${input.destinationBranchId}` : sql``}
      ${fromParam ? sql`AND pr.created_at >= ${fromParam}` : sql``}
      ${toParam ? sql`AND pr.created_at <= ${toParam}` : sql``}
    ORDER BY outstanding_psw DESC, pr.created_at DESC
  `);

  return rows.map((row) => ({
    parcelId: row.parcel_id,
    bookingCode: row.booking_code,
    trackingCode: row.tracking_code,
    createdAt:
      typeof row.created_at === 'string' || row.created_at instanceof Date
        ? new Date(row.created_at)
        : new Date(String(row.created_at)),
    status: Number(row.status),
    sourceBranchId: row.source_branch_id,
    sourceBranchName: row.source_branch_name,
    destinationBranchId: row.destination_branch_id,
    destinationBranchName: row.destination_branch_name,
    senderName: row.sender_name,
    receiverName: row.receiver_name,
    plannedToBePaidPsw: Number(row.planned_tobepaid_psw),
    paidPrincipalPsw: Number(row.paid_principal_psw),
    outstandingPsw: Number(row.outstanding_psw),
  })) as ToBePaidOutstandingReportRow[];
}

export async function listToBePaidCollectionsReconciliationReportRowsRepo(input: {
  companyId: string;
  sourceBranchId?: string | null;
  destinationBranchId?: string | null;
  from?: Date | null;
  to?: Date | null;
}) {
  const fromParam = input.from ? input.from.toISOString() : null;
  const toParam = input.to ? input.to.toISOString() : null;

  const rows = await db.execute(sql<{
    parcel_id: string;
    booking_code: string;
    tracking_code: string;
    created_at: string | Date;
    status: number;
    source_branch_id: string;
    source_branch_name: string | null;
    destination_branch_id: string;
    destination_branch_name: string | null;
    sender_name: string | null;
    receiver_name: string | null;
    planned_tobepaid_psw: string | number;
    collected_principal_psw: string | number;
    credited_principal_psw: string | number;
    recognized_principal_psw: string | number;
    outstanding_psw: string | number;
    variance_psw: string | number;
  }>`
    WITH principal_payments AS (
      SELECT
        p.parcel_id,
        COALESCE(SUM(p.gross_amount_psw), 0)::bigint AS collected_principal_psw
      FROM payments p
      WHERE p.company_id = ${input.companyId}
        AND p.component = ${PaymentComponent.PRINCIPAL}
        AND p.voided_at IS NULL
      GROUP BY p.parcel_id
    ),
    delivery_credit_principal AS (
      SELECT
        cct.reference_id AS parcel_id,
        COALESCE(SUM(cct.signed_amount_psw), 0)::bigint AS credited_principal_psw
      FROM customer_credit_transactions cct
      WHERE cct.company_id = ${input.companyId}
        AND cct.transaction_type = ${CustomerCreditTransactionType.CHARGE}
        AND cct.source_type = ${CustomerCreditSourceType.DELIVERY}
        AND cct.signed_amount_psw > 0
        AND cct.reference_id IS NOT NULL
        AND LOWER(COALESCE(cct.notes, '')) LIKE '%principal%'
      GROUP BY cct.reference_id
    )
    SELECT
      pr.id AS parcel_id,
      pr.booking_code,
      pr.tracking_code,
      pr.created_at,
      pr.status,
      pr.source_id AS source_branch_id,
      sb.name AS source_branch_name,
      pr.destination_id AS destination_branch_id,
      dbb.name AS destination_branch_name,
      s.fullname AS sender_name,
      r.fullname AS receiver_name,
      pr.planned_tobepaid_psw,
      COALESCE(pp.collected_principal_psw, 0)::bigint AS collected_principal_psw,
      COALESCE(dcp.credited_principal_psw, 0)::bigint AS credited_principal_psw,
      (COALESCE(pp.collected_principal_psw, 0) + COALESCE(dcp.credited_principal_psw, 0))::bigint AS recognized_principal_psw,
      GREATEST(
        pr.planned_tobepaid_psw - (COALESCE(pp.collected_principal_psw, 0) + COALESCE(dcp.credited_principal_psw, 0)),
        0
      )::bigint AS outstanding_psw,
      (
        (COALESCE(pp.collected_principal_psw, 0) + COALESCE(dcp.credited_principal_psw, 0)) - pr.planned_tobepaid_psw
      )::bigint AS variance_psw
    FROM parcels pr
    LEFT JOIN principal_payments pp ON pp.parcel_id = pr.id
    LEFT JOIN delivery_credit_principal dcp ON dcp.parcel_id = pr.id
    LEFT JOIN branches sb ON sb.id = pr.source_id
    LEFT JOIN branches dbb ON dbb.id = pr.destination_id
    LEFT JOIN customers s ON s.id = pr.sender_id
    LEFT JOIN customers r ON r.id = pr.receiver_id
    WHERE pr.company_id = ${input.companyId}
      AND pr.is_deleted = false
      AND pr.planned_tobepaid_psw > 0
      ${input.sourceBranchId ? sql`AND pr.source_id = ${input.sourceBranchId}` : sql``}
      ${input.destinationBranchId ? sql`AND pr.destination_id = ${input.destinationBranchId}` : sql``}
      ${fromParam ? sql`AND pr.created_at >= ${fromParam}` : sql``}
      ${toParam ? sql`AND pr.created_at <= ${toParam}` : sql``}
    ORDER BY pr.created_at DESC, pr.booking_code DESC
  `);

  return rows.map((row) => ({
    parcelId: row.parcel_id,
    bookingCode: row.booking_code,
    trackingCode: row.tracking_code,
    createdAt:
      typeof row.created_at === 'string' || row.created_at instanceof Date
        ? new Date(row.created_at)
        : new Date(String(row.created_at)),
    status: Number(row.status),
    sourceBranchId: row.source_branch_id,
    sourceBranchName: row.source_branch_name,
    destinationBranchId: row.destination_branch_id,
    destinationBranchName: row.destination_branch_name,
    senderName: row.sender_name,
    receiverName: row.receiver_name,
    plannedToBePaidPsw: Number(row.planned_tobepaid_psw),
    collectedPrincipalPsw: Number(row.collected_principal_psw),
    creditedPrincipalPsw: Number(row.credited_principal_psw),
    recognizedPrincipalPsw: Number(row.recognized_principal_psw),
    outstandingPsw: Number(row.outstanding_psw),
    variancePsw: Number(row.variance_psw),
  })) as ToBePaidCollectionsReconciliationReportRow[];
}

const sourceBranch = alias(branches, 'report_parcel_source_branch');
const destinationBranch = alias(branches, 'report_parcel_destination_branch');
const sender = alias(customers, 'report_parcel_sender');
const receiver = alias(customers, 'report_parcel_receiver');
