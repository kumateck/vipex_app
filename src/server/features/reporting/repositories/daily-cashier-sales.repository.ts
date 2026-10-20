import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, lte, lt, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import {
  branches,
  cashierSessions,
  customers,
  locations,
  parcels,
  payments,
  users,
} from '@/db/schemas';
import { getDailyCashierSalesPaymentTypes } from '../daily-cashier-sales-filter';
import { ParcelStatus } from '@/db/schemas/enums';
import type {
  DailyCashierSalesSessionRow,
  DailyCashierSalesTransactionRow,
  DailyCashierSalesToBePaidRow,
} from '../types';

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
  const sourceBranch = alias(branches, 'daily_cashier_sales_source_branch');
  const destinationBranch = alias(branches, 'daily_cashier_sales_destination_branch');
  const paymentTypes = getDailyCashierSalesPaymentTypes(input.cashierType);
  const cashierTypeFilter = paymentTypes ? [inArray(payments.cashierType, paymentTypes)] : [];

  return db
    .select({
      sessionId: cashierSessions.id,
      paymentId: payments.id,
      parcelId: payments.parcelId,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      sourceBranchId: parcels.sourceId,
      sourceBranchName: sourceBranch.name,
      destinationBranchId: parcels.destinationId,
      destinationBranchName: destinationBranch.name,
      parcelDetails: parcels.parcelDetails,
      parcelContent: parcels.parcelContent,
      senderName: sql<string>`coalesce(nullif(btrim(${parcels.senderNameSnapshot}), ''), ${sender.fullname}, '')`,
      senderTelephone: sender.telephone,
      receiverName: sql<string>`coalesce(nullif(btrim(${parcels.receiverNameSnapshot}), ''), ${receiver.fullname}, '')`,
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
    .leftJoin(sourceBranch, eq(sourceBranch.id, parcels.sourceId))
    .leftJoin(destinationBranch, eq(destinationBranch.id, parcels.destinationId))
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
      senderName: sql<string>`coalesce(nullif(btrim(${parcels.senderNameSnapshot}), ''), ${sender.fullname}, '')`,
      senderTelephone: sender.telephone,
      receiverName: sql<string>`coalesce(nullif(btrim(${parcels.receiverNameSnapshot}), ''), ${receiver.fullname}, '')`,
      receiverTelephone: receiver.telephone,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
      createdAt: parcels.createdAt,
    })
    .from(parcels)
    .innerJoin(cashierSessions, eq(cashierSessions.id, parcels.cashierSessionId))
    .innerJoin(users, eq(users.id, cashierSessions.cashierId))
    .leftJoin(sender, eq(sender.id, parcels.senderId))
    .leftJoin(receiver, eq(receiver.id, parcels.receiverId))
    .where(
      and(
        eq(parcels.companyId, input.companyId),
        eq(users.companyId, input.companyId),
        eq(parcels.sourceId, cashierSessions.branchId),
        or(isNull(parcels.processedBy), eq(parcels.processedBy, cashierSessions.cashierId)),
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
        sql`${parcels.status} <> ${ParcelStatus.CREATED}`,
        sql`${parcels.plannedToBePaidPsw} > 0`,
        eq(parcels.isDeleted, false),
        ...(input.branchId ? [eq(cashierSessions.branchId, input.branchId)] : []),
        ...(input.locationId ? [eq(users.locationId, input.locationId)] : []),
        ...(input.cashierUserId ? [eq(cashierSessions.cashierId, input.cashierUserId)] : []),
      ),
    )
    .orderBy(asc(parcels.createdAt), asc(parcels.id));
}
