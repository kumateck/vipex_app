import { desc, eq, inArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import {
  parcels,
  customers,
  users,
  warehouses,
  parcelDispositionActions,
  parcelStorageWaivers,
} from '@/db/schemas';
import { ParcelStatus } from '@/db/schemas/enums';
import {
  type DbExecutor,
  effectiveParcelReceivedAt,
  type ParcelRow,
} from './parcel-repository.types';

export async function getParcelRepo(
  id: string,
  executor: DbExecutor = db,
): Promise<ParcelRow | null> {
  const sender = alias(customers, 'parcel_sender');
  const receiver = alias(customers, 'parcel_receiver');
  const secondReceiver = alias(customers, 'parcel_second_receiver');
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
      senderNameSnapshot: sql<string>`coalesce(nullif(btrim(${parcels.senderNameSnapshot}), ''), ${sender.fullname}, '')`,
      receiverId: parcels.receiverId,
      receiverNameSnapshot: sql<string>`coalesce(nullif(btrim(${parcels.receiverNameSnapshot}), ''), ${receiver.fullname}, '')`,
      secondReceiverId: parcels.secondReceiverId,
      secondReceiverNameSnapshot: sql<
        string | null
      >`coalesce(nullif(btrim(${parcels.secondReceiverNameSnapshot}), ''), ${secondReceiver.fullname})`,
      status: parcels.status,
      parcelDetails: parcels.parcelDetails,
      parcelContent: parcels.parcelContent,
      parcelValuePsw: parcels.parcelValuePsw,
      chargeExemptCustomerType: parcels.chargeExemptCustomerType,
      relatedStaffId: parcels.relatedStaffId,
      relatedStaffNameSnapshot: parcels.relatedStaffNameSnapshot,
      chargePsw: parcels.chargePsw,
      cardId: parcels.cardId,
      cardNumber: parcels.cardNumber,
      secondCardId: parcels.secondCardId,
      secondCardNumber: parcels.secondCardNumber,
      pickupLocationId: parcels.pickupLocationId,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
      method: parcels.method,
      shelfPickerStaffId: parcels.shelfPickerStaffId,
      taxReportConfirmation: parcels.taxReportConfirmation,
      callSender: parcels.callSender,
      isDeleted: parcels.isDeleted,
      deletedBy: parcels.deletedBy,
      deletedAt: parcels.deletedAt,
      deleteReason: parcels.deleteReason,
      createdBy: parcels.createdBy,
      processedBy: parcels.processedBy,
      createdAt: parcels.createdAt,
      receivedBy: parcels.receivedBy,
      receivedAt: effectiveParcelReceivedAt(),
      confirmedBy: parcels.confirmedBy,
      confirmedAt: parcels.confirmedAt,
      updatedAt: parcels.updatedAt,
      cashierSessionId: parcels.cashierSessionId,
    })
    .from(parcels)
    .leftJoin(sender, eq(parcels.senderId, sender.id))
    .leftJoin(receiver, eq(parcels.receiverId, receiver.id))
    .leftJoin(secondReceiver, eq(parcels.secondReceiverId, secondReceiver.id))
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

export const STUCK_PARCEL_EXCLUDED_STATUSES = [
  ParcelStatus.DELIVERED_BY_OFFICE,
  ParcelStatus.DELIVERED_AT_HOME,
  ParcelStatus.RETURNED_TO_SENDER,
  ParcelStatus.RETURN_TO_SOURCE,
  ParcelStatus.CANCELLED,
  ParcelStatus.DISPOSED_BY_SALE,
  ParcelStatus.DISPOSED_BY_DESTRUCTION,
  ParcelStatus.DISPOSED_BY_DONATION,
];
