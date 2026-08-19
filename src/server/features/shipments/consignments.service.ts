import { db } from '@/db/config';
import { BadRequest, Forbidden, NotFound } from '../../utils/http-error';
import { ConsignmentReceivingStatus, ParcelStatus } from '@/db/schemas';
import { recordAuditLog } from '../audit/logger';
import { getBranchRepo } from '../branches/repository';
import { createParcelDiscrepancyRepo } from './parcel-discrepancies.repository';
import {
  addConsignmentItemsRepo,
  createConsignmentRepo,
  closeConsignmentRepo,
  getConsignmentItemRepo,
  getConsignmentReceivingCountsRepo,
  getConsignmentRepo,
  getNextSerialForDayRepo,
  listConsignmentItemsRepo,
  listConsignmentsForParcelRepo,
  listIncomingConsignmentsRepo,
  markConsignmentItemArrivedRepo,
  removeConsignmentItemRepo,
} from './consignments.repository';
import {
  getParcelByCodeRepo,
  updateParcelRepo,
  updateParcelsStatusRepo,
} from './parcels.repository';
import { getParcelSvc } from './parcels.service';

function makeCode(consignmentDate: Date, serial: number): string {
  const y = consignmentDate.getFullYear();
  const m = String(consignmentDate.getMonth() + 1).padStart(2, '0');
  const d = String(consignmentDate.getDate()).padStart(2, '0');
  return `${y}${m}${d}-${serial}`;
}

export async function createConsignmentSvc(input: {
  companyId: string;
  sourceId: string;
  destinationId: string;
  consignmentDate: string; // date-only ISO "YYYY-MM-DD"
  createdBy: string;
}) {
  if (!input.companyId || !input.sourceId || !input.destinationId)
    throw BadRequest('Missing required fields');
  const dateOnly = new Date(input.consignmentDate);
  const serial = await getNextSerialForDayRepo(input.companyId, input.sourceId, dateOnly);
  const code = makeCode(dateOnly, serial);
  const created = await createConsignmentRepo({
    companyId: input.companyId,
    sourceId: input.sourceId,
    destinationId: input.destinationId,
    consignmentDate: dateOnly,
    serialForDay: serial,
    code,
    createdBy: input.createdBy,
  });
  return { id: created.id, code, serialForDay: serial };
}

export async function addItemsToConsignmentSvc(input: {
  consignmentId: string;
  parcelIds: string[];
}) {
  if (input.parcelIds.length === 0) return { added: 0 };
  const consignment = await getConsignmentRepo(input.consignmentId);
  if (!consignment) {
    throw BadRequest('Consignment not found');
  }

  const uniqueParcelIds = [...new Set(input.parcelIds)];
  const parcels = await Promise.all(uniqueParcelIds.map((parcelId) => getParcelSvc(parcelId)));

  for (const parcel of parcels) {
    if (parcel.isDeleted) {
      throw BadRequest(`Parcel ${parcel.id} is deleted and cannot be assigned to a consignment`);
    }
    if (parcel.status !== ParcelStatus.PROCESSED) {
      throw BadRequest(`Parcel ${parcel.id} must be in PROCESSED status before consignment`);
    }
    if (parcel.companyId !== consignment.companyId || parcel.sourceId !== consignment.sourceId) {
      throw BadRequest(`Parcel ${parcel.id} does not belong to this source branch consignment`);
    }
    if (parcel.destinationId !== consignment.destinationId) {
      throw BadRequest(
        `Parcel ${parcel.id} destination does not match consignment destination branch`,
      );
    }
  }

  const added = await addConsignmentItemsRepo(
    uniqueParcelIds.map((parcelId) => ({ consignmentId: input.consignmentId, parcelId })),
  );
  if (added > 0) {
    await updateParcelsStatusRepo(uniqueParcelIds, ParcelStatus.IN_TRANSIT);
  }
  return { added };
}

export async function removeItemFromConsignmentSvc(input: {
  consignmentId: string;
  parcelId: string;
}) {
  const removed = await removeConsignmentItemRepo(input.consignmentId, input.parcelId, new Date());
  return { removed };
}

export async function getConsignmentDetailSvc(consignmentId: string) {
  const consignment = await getConsignmentRepo(consignmentId);
  if (!consignment) throw NotFound('Consignment not found');
  const counts = await getConsignmentReceivingCountsRepo(consignmentId);
  return { ...consignment, ...counts };
}

export async function listConsignmentItemsSvc(consignmentId: string) {
  const consignment = await getConsignmentRepo(consignmentId);
  if (!consignment) throw NotFound('Consignment not found');
  return listConsignmentItemsRepo(consignmentId);
}

export async function listIncomingConsignmentsSvc(input: {
  companyId: string;
  destinationId: string;
  statuses?: number[];
}) {
  return listIncomingConsignmentsRepo(input);
}

type ReceiveConsignmentItemOutcome =
  | { outcome: 'RECEIVED'; parcelId: string; trackingCode: string; arrived: number; total: number }
  | {
      outcome: 'ALREADY_RECEIVED';
      parcelId: string;
      trackingCode: string;
      arrivedAt: Date;
      arrivedByName: string | null;
    }
  | {
      outcome: 'WRONG_CONSIGNMENT';
      parcelId: string;
      trackingCode: string;
      belongsToConsignmentId: string | null;
      belongsToConsignmentCode: string | null;
    }
  | {
      outcome: 'NOT_DISPATCHED';
      parcelId: string;
      trackingCode: string;
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
      ...counts,
    };
  }

  // 0 rows updated: classify why.
  const item = await getConsignmentItemRepo(input.consignmentId, parcel.id);
  if (item?.arrivedAt) {
    return {
      outcome: 'ALREADY_RECEIVED',
      parcelId: parcel.id,
      trackingCode: parcel.trackingCode,
      arrivedAt: item.arrivedAt,
      arrivedByName: item.arrivedByName,
    };
  }

  // Not an active item of this consignment at all — find out where it actually belongs.
  const owningConsignments = await listConsignmentsForParcelRepo(parcel.id);
  const active = owningConsignments.find((c) => c.removedAt === null);

  if (!active) {
    // Never added to any consignment (or was removed from one) — it hasn't been
    // dispatched from its source branch, so "wrong consignment" would be misleading.
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

  const items = await listConsignmentItemsRepo(input.consignmentId);
  const missing = items.filter((i) => !i.arrivedAt);
  const missingParcelIds = missing.map((i) => i.parcelId);

  if (!input.forceWithExceptions) {
    throw BadRequest(
      `${total - arrived} of ${total} parcels have not arrived yet. Sign-off is required to close with exceptions.`,
      { arrived, total, missingParcelIds },
    );
  }

  const reason = (input.exceptionReason ?? '').trim();
  if (!reason) {
    throw BadRequest('A reason is required to close a consignment with missing parcels');
  }

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
