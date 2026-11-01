import { createParcelListContext } from '../parcel-list/parcel-list-context';
import { createParcelListOrder } from '../parcel-list/parcel-list-order';
import { and, count, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcels, bookings, deliveries, parcelInternalHolders, pickupQueues } from '@/db/schemas';
import {
  type DbExecutor,
  effectiveParcelReceivedAt,
  type ParcelRow,
  type ListParcelsParams,
} from './parcel-repository.types';

export async function listParcelsRepo(
  p: ListParcelsParams,
  executor: DbExecutor = db,
): Promise<{
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
    riderReturnedAt: Date | null;
    deliveryFeePsw: number | null;
    riderUserId: string | null;
    riderName: string | null;
    createdByName: string | null;
    pickupLocationName: string | null;
    pickupQueueId: string | null;
    pickupQueueCode: string | null;
    pickupQueueNumber: number | null;
    pickerStaffId: string | null;
    pickerStaffName: string | null;
    callCenterAssignedToUserId: string | null;
    callCenterAssignedToUserName: string | null;
    callCenterCalledAt: Date | null;
    pickupQueuedAt: Date | null;
    pickupQueueEndedAt: Date | null;
    deliveredAt: Date | null;
    currentHolderType: number | null;
    currentHolderBranchId: string | null;
    currentHolderBranchName: string | null;
    currentHolderLocationId: string | null;
    currentHolderLocationName: string | null;
    currentHolderWarehouseId: string | null;
    currentHolderWarehouseName: string | null;
    outstandingPrincipalPsw: number;
    paidPrincipalPsw: number;
    senderPaidPrincipalPsw: number;
    receiverPaidPrincipalPsw: number;
    outstandingDeliveryFeePsw: number;
  })[];
  totalRecords: number;
}> {
  const context = createParcelListContext(p);
  const {
    s,
    r,
    sr,
    senderName,
    receiverName,
    secondReceiverName,
    rider,
    creator,
    picker,
    callCenterAssignee,
    d,
    sb,
    sl,
    hb,
    ci,
    cg,
    pl,
    hl,
    hw,
    paidPrincipalPsw,
    senderPaidPrincipalPsw,
    receiverPaidPrincipalPsw,
    paidDeliveryFeePsw,
    outstandingPrincipalPsw,
  } = context;
  const { orderBy, pickupQueueJoin, whereClause } = createParcelListOrder(p, context);
  let countQuery = executor.select({ c: count() }).from(parcels).$dynamic();
  if (p.search) {
    countQuery = countQuery
      .leftJoin(s, eq(parcels.senderId, s.id))
      .leftJoin(r, eq(parcels.receiverId, r.id))
      .leftJoin(sr, eq(parcels.secondReceiverId, sr.id));
  }
  if (p.sentDate || p.consignmentNumber?.trim()) {
    countQuery = countQuery
      .leftJoin(ci, and(eq(ci.parcelId, parcels.id), isNull(ci.removedAt)))
      .leftJoin(cg, eq(cg.id, ci.consignmentId));
  }
  const countPromise = countQuery
    .leftJoin(deliveries, eq(deliveries.parcelId, parcels.id))
    .leftJoin(pickupQueues, pickupQueueJoin)
    .where(whereClause);
  const rowsPromise = executor
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
      senderNameSnapshot: senderName,
      receiverId: parcels.receiverId,
      receiverNameSnapshot: receiverName,
      secondReceiverId: parcels.secondReceiverId,
      secondReceiverNameSnapshot: secondReceiverName,
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
      outstandingPrincipalPsw: outstandingPrincipalPsw.mapWith(Number),
      paidPrincipalPsw: paidPrincipalPsw.mapWith(Number),
      senderPaidPrincipalPsw: senderPaidPrincipalPsw.mapWith(Number),
      receiverPaidPrincipalPsw: receiverPaidPrincipalPsw.mapWith(Number),
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
      processedBy: parcels.processedBy,
      createdAt: parcels.createdAt,
      receivedBy: parcels.receivedBy,
      receivedAt: effectiveParcelReceivedAt(),
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
      senderName,
      senderPhone: s.telephone,
      senderPhone2: s.telephone2,
      receiverName,
      receiverPhone: r.telephone,
      receiverPhone2: r.telephone2,
      secondReceiverName,
      secondReceiverPhone: sr.telephone,
      secondReceiverPhone2: sr.telephone2,
      dropoffAddress: deliveries.dropoffAddress,
      riderReturnedAt: deliveries.returnedAt,
      deliveryFeePsw: deliveries.chargePsw,
      riderUserId: deliveries.riderUserId,
      riderName: rider.fullname,
      createdByName: creator.fullname,
      pickupLocationName: pl.name,
      pickupQueueId: pickupQueues.id,
      pickupQueueCode: pickupQueues.queueCode,
      pickupQueueNumber: pickupQueues.queueNumber,
      shelfPickerStaffId: parcels.shelfPickerStaffId,
      pickerStaffId: sql<
        string | null
      >`coalesce(${parcels.shelfPickerStaffId}, ${pickupQueues.pickerStaffId})`,
      pickerStaffName: picker.fullname,
      callCenterAssignedToUserId: parcels.callCenterAssignedToUserId,
      callCenterAssignedToUserName: callCenterAssignee.fullname,
      callCenterCalledAt: parcels.callCenterCalledAt,
      pickupQueuedAt: pickupQueues.queuedAt,
      pickupQueueEndedAt: pickupQueues.endedAt,
      deliveredAt: deliveries.deliveredAt,
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
    .leftJoin(creator, eq(creator.id, parcels.createdBy))
    .leftJoin(pickupQueues, pickupQueueJoin)
    .leftJoin(
      picker,
      eq(
        picker.id,
        sql<string>`coalesce(${parcels.shelfPickerStaffId}, ${pickupQueues.pickerStaffId})`,
      ),
    )
    .leftJoin(callCenterAssignee, eq(callCenterAssignee.id, parcels.callCenterAssignedToUserId))
    .leftJoin(parcelInternalHolders, eq(parcelInternalHolders.parcelId, parcels.id))
    .leftJoin(hb, eq(hb.id, parcelInternalHolders.branchId))
    .leftJoin(hl, eq(hl.id, parcelInternalHolders.locationId))
    .leftJoin(hw, eq(hw.id, parcelInternalHolders.warehouseId))
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);
  const [[countRow], rows] = await Promise.all([countPromise, rowsPromise]);
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);
  return { data: rows, totalRecords };
}
