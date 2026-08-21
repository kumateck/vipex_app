import { db } from '@/db/config';
import { ConsignmentReceivingStatus, ParcelStatus } from '@/db/schemas';
import { BadRequest, Forbidden, NotFound } from '../../utils/http-error';
import { recordAuditLog } from '../audit/logger';
import { getBranchRepo } from '../branches/repository';
import { createParcelDiscrepancyRepo } from './parcel-discrepancies.repository';
import {
  closeConsignmentRepo,
  getConsignmentItemRepo,
  getConsignmentReceivingCountsRepo,
  listConsignmentItemsRepo,
  markConsignmentItemArrivedRepo,
} from './consignments-receiving.repository';
import { getConsignmentRepo, listConsignmentsForParcelRepo } from './consignments.repository';
import { getParcelByCodeRepo, updateParcelRepo } from './parcels.repository';

type ReceiveConsignmentItemOutcome =
  | {
      outcome: 'RECEIVED';
      parcelId: string;
      trackingCode: string;
      bookingCode: string;
      arrived: number;
      total: number;
    }
  | {
      outcome: 'ALREADY_RECEIVED';
      parcelId: string;
      trackingCode: string;
      bookingCode: string;
      arrivedAt: Date;
      arrivedByName: string | null;
    }
  | {
      outcome: 'WRONG_CONSIGNMENT';
      parcelId: string;
      trackingCode: string;
      bookingCode: string;
      belongsToConsignmentId: string | null;
      belongsToConsignmentCode: string | null;
    }
  | {
      outcome: 'NOT_DISPATCHED';
      parcelId: string;
      trackingCode: string;
      bookingCode: string;
      sourceBranchId: string;
      sourceBranchName: string | null;
    };

export async function receiveConsignmentItemSvc(input: {
  consignmentId: string;
  code: string;
  actorUserId: string;
  actorBranchId?: string | null;
}): Promise<ReceiveConsignmentItemOutcome> {
  const consignment = await getConsignmentRepo(input.consignmentId);
  if (!consignment) throw NotFound('Consignment not found');
  if (input.actorBranchId && input.actorBranchId !== consignment.destinationId) {
    throw Forbidden(
      'You are not at the destination branch for this consignment, so you cannot receive its parcels.',
    );
  }
  if (consignment.status !== ConsignmentReceivingStatus.OPEN) {
    throw BadRequest('This consignment is already closed');
  }

  const parcel = await getParcelByCodeRepo(consignment.companyId, input.code);
  if (!parcel) throw NotFound('No parcel matches this code');

  const arrivedAt = new Date();
  const receivedNow = await db.transaction(async (tx) => {
    const updated = await markConsignmentItemArrivedRepo(
      input.consignmentId,
      parcel.id,
      input.actorUserId,
      arrivedAt,
      tx,
    );
    if (updated) {
      await updateParcelRepo(
        parcel.id,
        {
          status: ParcelStatus.ARRIVED_AT_DESTINATION,
          receivedBy: input.actorUserId,
          receivedAt: arrivedAt,
        },
        tx,
      );
    }
    return updated;
  });

  if (receivedNow) {
    const counts = await getConsignmentReceivingCountsRepo(input.consignmentId);
    await recordAuditLog({
      companyId: consignment.companyId,
      actorUserId: input.actorUserId,
      entityType: 'consignment_item',
      entityId: parcel.id,
      action: 'CONSIGNMENT_ITEM_RECEIVED',
      message: `Parcel ${parcel.trackingCode} received into consignment ${consignment.code}`,
      metadata: { consignmentId: input.consignmentId, ...counts },
    });
    return {
      outcome: 'RECEIVED',
      parcelId: parcel.id,
      trackingCode: parcel.trackingCode,
      bookingCode: parcel.bookingCode,
      ...counts,
    };
  }

  const item = await getConsignmentItemRepo(input.consignmentId, parcel.id);
  if (item?.arrivedAt) {
    return {
      outcome: 'ALREADY_RECEIVED',
      parcelId: parcel.id,
      trackingCode: parcel.trackingCode,
      bookingCode: parcel.bookingCode,
      arrivedAt: item.arrivedAt,
      arrivedByName: item.arrivedByName,
    };
  }

  const active = (await listConsignmentsForParcelRepo(parcel.id)).find(
    (consignmentItem) => consignmentItem.removedAt === null,
  );
  if (!active) {
    const sourceBranch = await getBranchRepo(parcel.sourceId);
    await recordAuditLog({
      companyId: consignment.companyId,
      actorUserId: input.actorUserId,
      entityType: 'consignment_item',
      entityId: parcel.id,
      action: 'CONSIGNMENT_ITEM_NOT_DISPATCHED_SCAN',
      message: `Parcel ${parcel.trackingCode} scanned against consignment ${consignment.code} but has not been dispatched from ${sourceBranch?.name ?? parcel.sourceId}`,
      metadata: { scannedConsignmentId: input.consignmentId, sourceBranchId: parcel.sourceId },
    });
    return {
      outcome: 'NOT_DISPATCHED',
      parcelId: parcel.id,
      trackingCode: parcel.trackingCode,
      bookingCode: parcel.bookingCode,
      sourceBranchId: parcel.sourceId,
      sourceBranchName: sourceBranch?.name ?? null,
    };
  }

  await recordAuditLog({
    companyId: consignment.companyId,
    actorUserId: input.actorUserId,
    entityType: 'consignment_item',
    entityId: parcel.id,
    action: 'CONSIGNMENT_ITEM_WRONG_CONSIGNMENT_SCAN',
    message: `Parcel ${parcel.trackingCode} scanned against consignment ${consignment.code} but belongs to ${active.code}`,
    metadata: {
      scannedConsignmentId: input.consignmentId,
      actualConsignmentId: active.consignmentId,
    },
  });
  return {
    outcome: 'WRONG_CONSIGNMENT',
    parcelId: parcel.id,
    trackingCode: parcel.trackingCode,
    bookingCode: parcel.bookingCode,
    belongsToConsignmentId: active.consignmentId,
    belongsToConsignmentCode: active.code,
  };
}

export async function closeConsignmentSvc(input: {
  consignmentId: string;
  actorUserId: string;
  actorBranchId?: string | null;
  forceWithExceptions?: boolean;
  exceptionReason?: string;
}) {
  const consignment = await getConsignmentRepo(input.consignmentId);
  if (!consignment) throw NotFound('Consignment not found');
  if (input.actorBranchId && input.actorBranchId !== consignment.destinationId) {
    throw Forbidden(
      'You are not at the destination branch for this consignment, so you cannot close it.',
    );
  }
  if (consignment.status !== ConsignmentReceivingStatus.OPEN) {
    throw BadRequest('Consignment already closed');
  }

  const { arrived, total } = await getConsignmentReceivingCountsRepo(input.consignmentId);
  const closedAt = new Date();
  if (arrived === total) {
    await closeConsignmentRepo(input.consignmentId, {
      status: ConsignmentReceivingStatus.CLOSED,
      closedBy: input.actorUserId,
      closedAt,
      closedWithExceptions: false,
      closeExceptionReason: null,
    });
    await recordAuditLog({
      companyId: consignment.companyId,
      actorUserId: input.actorUserId,
      entityType: 'consignment',
      entityId: input.consignmentId,
      action: 'CONSIGNMENT_CLOSED',
      message: `Consignment ${consignment.code} closed: all ${total} parcels received`,
      metadata: { arrived, total },
    });
    return { status: ConsignmentReceivingStatus.CLOSED, arrived, total, missingParcelIds: [] };
  }

  const missing = (await listConsignmentItemsRepo(input.consignmentId)).filter(
    (item) => !item.arrivedAt,
  );
  const missingParcelIds = missing.map((item) => item.parcelId);
  if (!input.forceWithExceptions) {
    throw BadRequest(
      `${total - arrived} of ${total} parcels have not arrived yet. Sign-off is required to close with exceptions.`,
      { arrived, total, missingParcelIds },
    );
  }

  const reason = (input.exceptionReason ?? '').trim();
  if (!reason) throw BadRequest('A reason is required to close a consignment with missing parcels');

  await db.transaction(async (tx) => {
    await closeConsignmentRepo(
      input.consignmentId,
      {
        status: ConsignmentReceivingStatus.CLOSED_WITH_EXCEPTIONS,
        closedBy: input.actorUserId,
        closedAt,
        closedWithExceptions: true,
        closeExceptionReason: reason,
      },
      tx,
    );
    for (const item of missing) {
      await createParcelDiscrepancyRepo(
        {
          companyId: consignment.companyId,
          parcelId: item.parcelId,
          branchId: consignment.destinationId,
          consignmentId: input.consignmentId,
          trackingCode: item.trackingCode,
          bookingCode: item.bookingCode,
          discrepancyType: 'consignment_item_not_arrived',
          notes: reason,
          createdBy: input.actorUserId,
        },
        tx,
      );
    }
  });

  await recordAuditLog({
    companyId: consignment.companyId,
    actorUserId: input.actorUserId,
    entityType: 'consignment',
    entityId: input.consignmentId,
    action: 'CONSIGNMENT_CLOSED_WITH_EXCEPTIONS',
    message: `Consignment ${consignment.code} closed with ${missingParcelIds.length} missing parcels`,
    metadata: { arrived, total, missingParcelIds, exceptionReason: reason },
  });
  return {
    status: ConsignmentReceivingStatus.CLOSED_WITH_EXCEPTIONS,
    arrived,
    total,
    missingParcelIds,
  };
}
