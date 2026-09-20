import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNull,
  isNotNull,
  lte,
  notInArray,
  or,
  sql,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import {
  parcels,
  bookings,
  branches,
  customers,
  consignmentItems,
  consignments,
  deliveries,
  locations,
  users,
  parcelInternalHolders,
  pickupQueues,
  warehouses,
  parcelDispositionActions,
  parcelStorageWaivers,
  payments,
} from '@/db/schemas';
import { ParcelStatus, PaymentComponent } from '@/db/schemas/enums';
import type { SortField } from '@/server/types/pagination.types';
import { extractScannedCode } from '@/server/utils/scan-code';
type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;
export type ParcelRow = {
  id: string;
  companyId: string;
  sourceId: string;
  sourceLocationId: string | null;
  destinationId: string;
  bookingId: string;
  bookingCode: string;
  trackingCode: string;
  senderId: string;
  receiverId: string;
  secondReceiverId: string | null;
  status: number;
  parcelDetails: string;
  parcelContent: string;
  parcelValuePsw: number;
  chargePsw: number;
  cardId: string | null;
  cardNumber: string | null;
  secondCardId: string | null;
  secondCardNumber: string | null;
  pickupLocationId: string | null;
  plannedToBePaidPsw: number;
  method: number;
  taxReportConfirmation: boolean;
  callSender: boolean;
  isDeleted: boolean;
  deletedBy: string | null;
  deletedAt: Date | null;
  deleteReason: string | null;
  createdBy: string | null;
  createdAt: Date;
  receivedBy: string | null;
  receivedAt: Date | null;
  confirmedBy: string | null;
  confirmedAt: Date | null;
  updatedAt: Date;
  cashierSessionId: string | null;
};

export type ListParcelsParams = {
  limit: number;
  offset: number;
  companyId?: string | null;
  sourceId?: string | null;
  destinationId?: string | null;
  locationId?: string | null;
  status?: number | null;
  statuses?: number[] | null;
  senderPaid?: boolean | null;
  hasPickupQueue?: boolean | null;
  agedOnly?: boolean | null;
  storageChargeAccruing?: boolean | null;
  ageThresholdMonths?: number | null;
  storageGraceDays?: number | null;
  search?: string | null; // bookingCode/trackingCode/sender/receiver names/phones
  received?: boolean | null;
  includeDeleted?: boolean | null;
  assignedToUserId?: string | null;
  sort?: SortField[] | null;
};

export async function listParcelsRepo(p: ListParcelsParams): Promise<{
  data: (ParcelRow & {
    bookingCreatedAt: Date | null;
    destinationName: string | null;
    consignmentId: string | null;
    consignmentCode: string | null;
    consignmentSerialForDay: number | null;
    consignmentCreatedAt: Date | null;
    senderName: string | null;
    senderPhone: string | null;
    senderPhone2: string | null;
    receiverName: string | null;
    receiverPhone: string | null;
    receiverPhone2: string | null;
    secondReceiverName: string | null;
    secondReceiverPhone: string | null;
    secondReceiverPhone2: string | null;
    dropoffAddress: string | null;
    deliveryFeePsw: number | null;
    riderUserId: string | null;
    riderName: string | null;
    pickupLocationName: string | null;
    pickupQueueId: string | null;
    pickupQueueCode: string | null;
    pickupQueueNumber: number | null;
    pickerStaffId: string | null;
    pickerStaffName: string | null;
    callCenterAssignedToUserId: string | null;
    callCenterAssignedToUserName: string | null;
    pickupQueuedAt: Date | null;
    pickupQueueEndedAt: Date | null;
    currentHolderType: number | null;
    currentHolderBranchId: string | null;
    currentHolderBranchName: string | null;
    currentHolderLocationId: string | null;
    currentHolderLocationName: string | null;
    currentHolderWarehouseId: string | null;
    currentHolderWarehouseName: string | null;
    outstandingPrincipalPsw: number;
    outstandingDeliveryFeePsw: number;
  })[];
  totalRecords: number;
}> {
  const whereParts: (
    | ReturnType<typeof eq>
    | ReturnType<typeof and>
    | ReturnType<typeof or>
    | ReturnType<typeof isNull>
    | ReturnType<typeof isNotNull>
  )[] = [];
  if (!p.includeDeleted) whereParts.push(eq(parcels.isDeleted, false));
  if (p.companyId) whereParts.push(eq(parcels.companyId, p.companyId));
  if (p.sourceId) whereParts.push(eq(parcels.sourceId, p.sourceId));
  if (p.destinationId) whereParts.push(eq(parcels.destinationId, p.destinationId));
  if (p.assignedToUserId) {
    whereParts.push(eq(parcels.callCenterAssignedToUserId, p.assignedToUserId));
  }
  if (p.statuses && p.statuses.length > 0) {
    whereParts.push(inArray(parcels.status, p.statuses));
  } else if (p.status != null) {
    whereParts.push(eq(parcels.status, p.status));
  }
  if (p.received === true) whereParts.push(isNotNull(parcels.receivedAt));
  if (p.received === false) whereParts.push(isNull(parcels.receivedAt));
  if (p.senderPaid === true) whereParts.push(lte(parcels.plannedToBePaidPsw, 0));
  if (p.senderPaid === false) whereParts.push(gt(parcels.plannedToBePaidPsw, 0));
  const s = alias(customers, 's');
  const r = alias(customers, 'r');
  const sr = alias(customers, 'sr');
  const rider = alias(users, 'rider');
  const picker = alias(users, 'picker');
  const callCenterAssignee = alias(users, 'call_center_assignee');
  const d = alias(branches, 'd');
  const sb = alias(branches, 'sb');
  const sl = alias(locations, 'sl');
  const hb = alias(branches, 'hb');
  const ci = alias(consignmentItems, 'ci');
  const cg = alias(consignments, 'cg');
  const pl = alias(locations, 'pl');
  const hl = alias(locations, 'hl');
  const hw = alias(warehouses, 'hw');
  const paidPrincipalPsw = sql<number>`coalesce((
    select sum(${payments.grossAmountPsw})
    from ${payments}
    where ${payments.parcelId} = ${parcels.id}
      and ${payments.component} = ${PaymentComponent.PRINCIPAL}
      and ${payments.voidedAt} is null
  ), 0)`;
  const paidDeliveryFeePsw = sql<number>`coalesce((
    select sum(${payments.grossAmountPsw})
    from ${payments}
    where ${payments.parcelId} = ${parcels.id}
      and ${payments.component} = ${PaymentComponent.DELIVERY_FEE}
      and ${payments.voidedAt} is null
  ), 0)`;

  if (p.locationId) whereParts.push(eq(parcels.pickupLocationId, p.locationId));
  if (p.hasPickupQueue === true) whereParts.push(isNotNull(pickupQueues.id));
  if (p.hasPickupQueue === false) whereParts.push(isNull(pickupQueues.id));
  if (p.agedOnly === true || p.storageChargeAccruing === true) {
    const now = new Date();
    const graceDays = Math.max(1, Number(p.storageGraceDays ?? 14));
    const ageThresholdMonths = Math.max(1, Number(p.ageThresholdMonths ?? 6));

    whereParts.push(inArray(parcels.status, [5, 7]));
    whereParts.push(isNotNull(parcels.receivedAt));

    if (p.storageChargeAccruing === true) {
      const chargeCutoff = new Date(now.getTime() - graceDays * 24 * 60 * 60 * 1000);
      whereParts.push(lte(parcels.receivedAt, chargeCutoff));
    }
    if (p.agedOnly === true) {
      const agedCutoff = new Date(now);
      agedCutoff.setMonth(agedCutoff.getMonth() - ageThresholdMonths);
      whereParts.push(lte(parcels.receivedAt, agedCutoff));
    }
  }

  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((srt) => {
          if (srt.field === 'createdAt')
            return srt.direction === 'desc' ? desc(parcels.createdAt) : asc(parcels.createdAt);
          if (srt.field === 'trackingCode')
            return srt.direction === 'desc'
              ? desc(parcels.trackingCode)
              : asc(parcels.trackingCode);
          if (srt.field === 'bookingCode')
            return srt.direction === 'desc' ? desc(parcels.bookingCode) : asc(parcels.bookingCode);
          if (srt.field === 'pickupQueueNumber')
            return srt.direction === 'desc'
              ? desc(pickupQueues.queueNumber)
              : asc(pickupQueues.queueNumber);
          if (srt.field === 'id')
            return srt.direction === 'desc' ? desc(parcels.id) : asc(parcels.id);
          return null;
        })
        .filter((value): value is ReturnType<typeof asc> => value !== null)
    : [asc(parcels.createdAt), asc(parcels.id)];

  const [countRow] = await db
    .select({ c: count() })
    .from(parcels)
    .leftJoin(bookings, eq(parcels.bookingId, bookings.id))
    .leftJoin(s, eq(parcels.senderId, s.id))
    .leftJoin(r, eq(parcels.receiverId, r.id))
    .leftJoin(d, eq(parcels.destinationId, d.id))
    .leftJoin(deliveries, eq(deliveries.parcelId, parcels.id))
    .leftJoin(pickupQueues, eq(pickupQueues.parcelId, parcels.id))
    .where(
      whereParts.length || p.search
        ? and(
            ...(whereParts as [(typeof whereParts)[number], ...(typeof whereParts)[number][]]),
            ...(p.search
              ? [
                  or(
                    ilike(parcels.bookingCode, `%${p.search}%`),
                    ilike(parcels.trackingCode, `%${p.search}%`),
                    ilike(s.fullname, `%${p.search}%`),
                    ilike(s.telephone, `%${p.search}%`),
                    ilike(s.telephone2, `%${p.search}%`),
                    ilike(r.fullname, `%${p.search}%`),
                    ilike(r.telephone, `%${p.search}%`),
                    ilike(r.telephone2, `%${p.search}%`),
                  ),
                ]
              : []),
          )
        : undefined,
    );
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);

  const rows = await db
    .select({
      id: parcels.id,
      companyId: parcels.companyId,
      sourceId: parcels.sourceId,
      sourceLocationId: parcels.sourceLocationId,
      destinationId: parcels.destinationId,
      bookingId: parcels.bookingId,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      senderId: parcels.senderId,
      receiverId: parcels.receiverId,
      secondReceiverId: parcels.secondReceiverId,
      status: parcels.status,
      parcelDetails: parcels.parcelDetails,
      parcelContent: parcels.parcelContent,
      parcelValuePsw: parcels.parcelValuePsw,
      chargePsw: parcels.chargePsw,
      cardId: parcels.cardId,
      cardNumber: parcels.cardNumber,
      secondCardId: parcels.secondCardId,
      secondCardNumber: parcels.secondCardNumber,
      pickupLocationId: parcels.pickupLocationId,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
      outstandingPrincipalPsw:
        sql<number>`greatest(${parcels.plannedToBePaidPsw} - ${paidPrincipalPsw}, 0)`.mapWith(
          Number,
        ),
      outstandingDeliveryFeePsw:
        sql<number>`greatest(coalesce(${deliveries.chargePsw}, 0) - ${paidDeliveryFeePsw}, 0)`.mapWith(
          Number,
        ),
      method: parcels.method,
      taxReportConfirmation: parcels.taxReportConfirmation,
      callSender: parcels.callSender,
      isDeleted: parcels.isDeleted,
      deletedBy: parcels.deletedBy,
      deletedAt: parcels.deletedAt,
      deleteReason: parcels.deleteReason,
      createdBy: parcels.createdBy,
      createdAt: parcels.createdAt,
      receivedBy: parcels.receivedBy,
      receivedAt: sql<Date | null>`coalesce(
          ${parcels.receivedAt},
          (
            select min(receive_audit.created_at)
            from audit_logs receive_audit
            where receive_audit.entity_type = 'parcel'
              and receive_audit.entity_id = ${parcels.id}
              and receive_audit.action = 'PARCEL_UPDATED'
              and receive_audit.metadata->'patch'->>'status' = '3'
          )
        )`.mapWith((value) => (value == null ? null : new Date(String(value)))),
      confirmedBy: parcels.confirmedBy,
      confirmedAt: parcels.confirmedAt,
      updatedAt: parcels.updatedAt,
      cashierSessionId: parcels.cashierSessionId,
      bookingCreatedAt: bookings.createdAt,
      sourceName: sb.name,
      sourceLocationName: sl.name,
      destinationName: d.name,
      consignmentId: cg.id,
      consignmentCode: cg.code,
      consignmentSerialForDay: cg.serialForDay,
      consignmentCreatedAt: cg.createdAt,
      senderName: s.fullname,
      senderPhone: s.telephone,
      senderPhone2: s.telephone2,
      receiverName: r.fullname,
      receiverPhone: r.telephone,
      receiverPhone2: r.telephone2,
      secondReceiverName: sr.fullname,
      secondReceiverPhone: sr.telephone,
      secondReceiverPhone2: sr.telephone2,
      dropoffAddress: deliveries.dropoffAddress,
      deliveryFeePsw: deliveries.chargePsw,
      riderUserId: deliveries.riderUserId,
      riderName: rider.fullname,
      pickupLocationName: pl.name,
      pickupQueueId: pickupQueues.id,
      pickupQueueCode: pickupQueues.queueCode,
      pickupQueueNumber: pickupQueues.queueNumber,
      pickerStaffId: pickupQueues.pickerStaffId,
      pickerStaffName: picker.fullname,
      callCenterAssignedToUserId: parcels.callCenterAssignedToUserId,
      callCenterAssignedToUserName: callCenterAssignee.fullname,
      pickupQueuedAt: pickupQueues.queuedAt,
      pickupQueueEndedAt: pickupQueues.endedAt,
      currentHolderType: parcelInternalHolders.holderType,
      currentHolderBranchId: parcelInternalHolders.branchId,
      currentHolderBranchName: hb.name,
      currentHolderLocationId: parcelInternalHolders.locationId,
      currentHolderLocationName: hl.name,
      currentHolderWarehouseId: parcelInternalHolders.warehouseId,
      currentHolderWarehouseName: hw.name,
    })
    .from(parcels)
    .leftJoin(bookings, eq(parcels.bookingId, bookings.id))
    .leftJoin(s, eq(parcels.senderId, s.id))
    .leftJoin(r, eq(parcels.receiverId, r.id))
    .leftJoin(sr, eq(parcels.secondReceiverId, sr.id))
    .leftJoin(d, eq(parcels.destinationId, d.id))
    .leftJoin(sb, eq(parcels.sourceId, sb.id))
    .leftJoin(sl, eq(sl.id, parcels.sourceLocationId))
    .leftJoin(pl, eq(pl.id, parcels.pickupLocationId))
    .leftJoin(ci, and(eq(ci.parcelId, parcels.id), isNull(ci.removedAt)))
    .leftJoin(cg, eq(cg.id, ci.consignmentId))
    .leftJoin(deliveries, eq(deliveries.parcelId, parcels.id))
    .leftJoin(rider, eq(rider.id, deliveries.riderUserId))
    .leftJoin(pickupQueues, eq(pickupQueues.parcelId, parcels.id))
    .leftJoin(picker, eq(picker.id, pickupQueues.pickerStaffId))
    .leftJoin(callCenterAssignee, eq(callCenterAssignee.id, parcels.callCenterAssignedToUserId))
    .leftJoin(parcelInternalHolders, eq(parcelInternalHolders.parcelId, parcels.id))
    .leftJoin(hb, eq(hb.id, parcelInternalHolders.branchId))
    .leftJoin(hl, eq(hl.id, parcelInternalHolders.locationId))
    .leftJoin(hw, eq(hw.id, parcelInternalHolders.warehouseId))
    .where(
      whereParts.length || p.search
        ? and(
            ...(whereParts as [(typeof whereParts)[number], ...(typeof whereParts)[number][]]),
            ...(p.search
              ? [
                  or(
                    ilike(parcels.bookingCode, `%${p.search}%`),
                    ilike(parcels.trackingCode, `%${p.search}%`),
                    ilike(s.fullname, `%${p.search}%`),
                    ilike(s.telephone, `%${p.search}%`),
                    ilike(s.telephone2, `%${p.search}%`),
                    ilike(r.fullname, `%${p.search}%`),
                    ilike(r.telephone, `%${p.search}%`),
                    ilike(r.telephone2, `%${p.search}%`),
                  ),
                ]
              : []),
          )
        : undefined,
    )
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  return { data: rows, totalRecords };
}

export async function getParcelRepo(
  id: string,
  executor: DbExecutor = db,
): Promise<ParcelRow | null> {
  const [row] = await executor
    .select({
      id: parcels.id,
      companyId: parcels.companyId,
      sourceId: parcels.sourceId,
      sourceLocationId: parcels.sourceLocationId,
      destinationId: parcels.destinationId,
      bookingId: parcels.bookingId,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      senderId: parcels.senderId,
      receiverId: parcels.receiverId,
      secondReceiverId: parcels.secondReceiverId,
      status: parcels.status,
      parcelDetails: parcels.parcelDetails,
      parcelContent: parcels.parcelContent,
      parcelValuePsw: parcels.parcelValuePsw,
      chargePsw: parcels.chargePsw,
      cardId: parcels.cardId,
      cardNumber: parcels.cardNumber,
      secondCardId: parcels.secondCardId,
      secondCardNumber: parcels.secondCardNumber,
      pickupLocationId: parcels.pickupLocationId,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
      method: parcels.method,
      taxReportConfirmation: parcels.taxReportConfirmation,
      callSender: parcels.callSender,
      isDeleted: parcels.isDeleted,
      deletedBy: parcels.deletedBy,
      deletedAt: parcels.deletedAt,
      deleteReason: parcels.deleteReason,
      createdBy: parcels.createdBy,
      createdAt: parcels.createdAt,
      receivedBy: parcels.receivedBy,
      receivedAt: parcels.receivedAt,
      confirmedBy: parcels.confirmedBy,
      confirmedAt: parcels.confirmedAt,
      updatedAt: parcels.updatedAt,
      cashierSessionId: parcels.cashierSessionId,
    })
    .from(parcels)
    .where(eq(parcels.id, id))
    .limit(1);
  return row ?? null;
}

export async function createParcelRepo(
  values: typeof parcels.$inferInsert,
  executor: DbExecutor = db,
): Promise<{ id: string }> {
  const [row] = await executor.insert(parcels).values(values).returning({ id: parcels.id });
  return row ?? { id: '' };
}

export async function updateParcelRepo(
  id: string,
  patch: Partial<typeof parcels.$inferInsert>,
  executor: DbExecutor = db,
): Promise<{ id: string } | null> {
  const [row] = await executor
    .update(parcels)
    .set(patch)
    .where(eq(parcels.id, id))
    .returning({ id: parcels.id });
  return row ?? null;
}

export async function updateParcelsStatusRepo(
  parcelIds: string[],
  status: number,
): Promise<number> {
  if (parcelIds.length === 0) return 0;

  const rows = await db
    .update(parcels)
    .set({ status })
    .where(inArray(parcels.id, parcelIds))
    .returning({ id: parcels.id });

  return rows.length;
}

export async function createParcelDispositionActionRepo(
  values: typeof parcelDispositionActions.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .insert(parcelDispositionActions)
    .values(values)
    .returning({ id: parcelDispositionActions.id });
  return row ?? null;
}

export async function listParcelDispositionActionsRepo(parcelId: string) {
  const performedBy = alias(users, 'pda_performed_by');

  return db
    .select({
      id: parcelDispositionActions.id,
      companyId: parcelDispositionActions.companyId,
      parcelId: parcelDispositionActions.parcelId,
      actionType: parcelDispositionActions.actionType,
      warehouseId: parcelDispositionActions.warehouseId,
      warehouseName: warehouses.name,
      notes: parcelDispositionActions.notes,
      recoveredAmountPsw: parcelDispositionActions.recoveredAmountPsw,
      performedBy: parcelDispositionActions.performedBy,
      performedByName: performedBy.fullname,
      performedAt: parcelDispositionActions.performedAt,
      createdAt: parcelDispositionActions.createdAt,
    })
    .from(parcelDispositionActions)
    .leftJoin(warehouses, eq(warehouses.id, parcelDispositionActions.warehouseId))
    .leftJoin(performedBy, eq(performedBy.id, parcelDispositionActions.performedBy))
    .where(eq(parcelDispositionActions.parcelId, parcelId))
    .orderBy(desc(parcelDispositionActions.performedAt), desc(parcelDispositionActions.id));
}

export async function createParcelStorageWaiverRepo(
  values: typeof parcelStorageWaivers.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .insert(parcelStorageWaivers)
    .values(values)
    .returning({ id: parcelStorageWaivers.id });
  return row ?? null;
}

export async function listParcelStorageWaiversRepo(parcelId: string) {
  const waivedBy = alias(users, 'psw_waived_by');

  return db
    .select({
      id: parcelStorageWaivers.id,
      companyId: parcelStorageWaivers.companyId,
      parcelId: parcelStorageWaivers.parcelId,
      waivedAmountPsw: parcelStorageWaivers.waivedAmountPsw,
      reason: parcelStorageWaivers.reason,
      waivedBy: parcelStorageWaivers.waivedBy,
      waivedByName: waivedBy.fullname,
      waivedAt: parcelStorageWaivers.waivedAt,
      accountingJournalEntryId: parcelStorageWaivers.accountingJournalEntryId,
      accountingPostedAt: parcelStorageWaivers.accountingPostedAt,
      createdAt: parcelStorageWaivers.createdAt,
    })
    .from(parcelStorageWaivers)
    .leftJoin(waivedBy, eq(waivedBy.id, parcelStorageWaivers.waivedBy))
    .where(eq(parcelStorageWaivers.parcelId, parcelId))
    .orderBy(desc(parcelStorageWaivers.waivedAt), desc(parcelStorageWaivers.id));
}

export async function updateParcelStorageWaiverAccountingPostingRepo(
  id: string,
  patch: {
    accountingJournalEntryId?: string | null;
    accountingPostedAt?: Date | null;
  },
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .update(parcelStorageWaivers)
    .set({
      ...(patch.accountingJournalEntryId !== undefined
        ? { accountingJournalEntryId: patch.accountingJournalEntryId ?? null }
        : {}),
      ...(patch.accountingPostedAt !== undefined
        ? { accountingPostedAt: patch.accountingPostedAt ?? null }
        : {}),
    })
    .where(eq(parcelStorageWaivers.id, id))
    .returning({ id: parcelStorageWaivers.id });

  return row ?? null;
}

export async function sumParcelStorageWaiversPswRepo(
  parcelId: string,
  executor: DbExecutor = db,
): Promise<number> {
  const rows = await executor
    .select({
      waivedAmountPsw: parcelStorageWaivers.waivedAmountPsw,
    })
    .from(parcelStorageWaivers)
    .where(eq(parcelStorageWaivers.parcelId, parcelId));

  return rows.reduce((sum, row) => sum + Number(row.waivedAmountPsw ?? 0), 0);
}

const STUCK_PARCEL_EXCLUDED_STATUSES = [
  ParcelStatus.DELIVERED_BY_OFFICE,
  ParcelStatus.DELIVERED_AT_HOME,
  ParcelStatus.RETURNED_TO_SENDER,
  ParcelStatus.CANCELLED,
  ParcelStatus.DISPOSED_BY_SALE,
  ParcelStatus.DISPOSED_BY_DESTRUCTION,
  ParcelStatus.DISPOSED_BY_DONATION,
];

export type ListStuckParcelsParams = {
  companyId: string;
  branchId?: string | null;
  stuckAfterDays: number;
  limit: number;
  offset: number;
};

/**
 * Parcels sitting in a non-terminal status with no status update in
 * `stuckAfterDays` days — used by the Operations Exceptions Brief to ground
 * an LLM narrative. No dedicated "stuck" detection existed before this;
 * intentionally a lean count-oriented query (no joins) since the brief only
 * needs totals + a small sample, not full parcel detail rows.
 */
export async function listStuckParcelsRepo(p: ListStuckParcelsParams): Promise<{
  data: {
    id: string;
    trackingCode: string;
    bookingCode: string;
    status: number;
    updatedAt: Date;
    destinationId: string | null;
  }[];
  totalRecords: number;
}> {
  const cutoff = new Date(Date.now() - p.stuckAfterDays * 24 * 60 * 60 * 1000);
  const whereParts = [
    eq(parcels.isDeleted, false),
    eq(parcels.companyId, p.companyId),
    notInArray(parcels.status, STUCK_PARCEL_EXCLUDED_STATUSES),
    lte(parcels.updatedAt, cutoff),
  ];
  if (p.branchId) whereParts.push(eq(parcels.destinationId, p.branchId));

  const where = and(...whereParts);

  const [countRow] = await db.select({ c: count() }).from(parcels).where(where);

  const rows = await db
    .select({
      id: parcels.id,
      trackingCode: parcels.trackingCode,
      bookingCode: parcels.bookingCode,
      status: parcels.status,
      updatedAt: parcels.updatedAt,
      destinationId: parcels.destinationId,
    })
    .from(parcels)
    .where(where)
    .orderBy(asc(parcels.updatedAt))
    .limit(p.limit)
    .offset(p.offset);

  return { data: rows, totalRecords: Number(countRow?.c ?? 0) };
}

export async function getParcelByCodeRepo(
  companyId: string,
  code: string,
  executor: DbExecutor = db,
): Promise<{ id: string; trackingCode: string; bookingCode: string; sourceId: string } | null> {
  const trimmed = extractScannedCode(code);
  if (!trimmed) return null;
  const [row] = await executor
    .select({
      id: parcels.id,
      trackingCode: parcels.trackingCode,
      bookingCode: parcels.bookingCode,
      sourceId: parcels.sourceId,
    })
    .from(parcels)
    .where(
      and(
        eq(parcels.companyId, companyId),
        or(eq(parcels.trackingCode, trimmed), eq(parcels.bookingCode, trimmed)),
      ),
    )
    .limit(1);
  return row ?? null;
}
