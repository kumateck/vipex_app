import { toPesewas } from '@/server/utils/gh-money';
import { ParcelStatus } from '@/db/schemas';
import { db } from '@/db/config';
import { BadRequest, Conflict, NotFound } from '../../utils/http-error';
import {
  listAllPaymentsForParcelRepo,
  listPaymentsForParcelRepo,
  softVoidPaymentsByIdsRepo,
} from '../payments/repository';
import { getDeliveryByParcelRepo } from '../deliveries/repository';
import { recordAuditLog } from '../audit/logger';
import { listConsignmentsForParcelRepo } from './consignments.repository';
import { getPickupQueueByParcelRepo } from '../pickup-queues/repository';
import { endPickupQueueForParcelSvc } from '../pickup-queues/service';
import { getParcelInternalHolderByParcelRepo } from '../parcel-internal-transfers/repository';

import {
  createParcelRepo,
  getParcelRepo,
  listParcelsRepo,
  updateParcelRepo,
  type ListParcelsParams,
  type ParcelRow,
} from './parcels.repository';
import { assertParcelFullyPaid } from './parcel-payment-settlement';
type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const err = error as { code?: unknown; cause?: unknown };
  if (typeof err.code === 'string') return err.code;
  if (err.cause && typeof err.cause === 'object') {
    const cause = err.cause as { code?: unknown };
    if (typeof cause.code === 'string') return cause.code;
  }
  return undefined;
}

function isSchemaCompatibilityError(error: unknown): boolean {
  const code = getErrorCode(error);
  return code === '42P01' || code === '42703';
}

export async function listParcelsSvc(p: ListParcelsParams) {
  return listParcelsRepo(p);
}
export async function getParcelSvc(id: string, executor: DbExecutor = db): Promise<ParcelRow> {
  const row = await getParcelRepo(id, executor);
  if (!row) throw NotFound('Parcel not found');
  return row;
}
export async function createParcelSvc(input: {
  companyId: string;
  sourceId: string;
  destinationId: string;
  bookingId: string;
  bookingCode: string;
  trackingCode: string;
  senderId: string;
  receiverId: string;
  status: number;
  parcelDetails: string;
  parcelContent: string;
  parcelValueCedis?: number | string | null;
  chargeCedis?: number | string | null;
  plannedToBePaidCedis?: number | string | null;
  method: number;
  createdBy?: string | null;
  cashierSessionId?: string | null;
}): Promise<{ id: string }> {
  if (
    !input.companyId ||
    !input.sourceId ||
    !input.destinationId ||
    !input.bookingId ||
    !input.bookingCode ||
    !input.trackingCode
  ) {
    throw BadRequest('Missing required fields');
  }
  const parcelValuePsw = input.parcelValueCedis != null ? toPesewas(input.parcelValueCedis) : 0n;
  const plannedToBePaidPsw =
    input.plannedToBePaidCedis != null ? toPesewas(input.plannedToBePaidCedis) : 0n;
  const chargePsw = input.chargeCedis != null ? toPesewas(input.chargeCedis) : plannedToBePaidPsw;
  const created = await createParcelRepo({
    companyId: input.companyId,
    sourceId: input.sourceId,
    destinationId: input.destinationId,
    bookingId: input.bookingId,
    bookingCode: input.bookingCode,
    trackingCode: input.trackingCode,
    senderId: input.senderId,
    receiverId: input.receiverId,
    status: input.status,
    parcelDetails: input.parcelDetails,
    parcelContent: input.parcelContent,
    parcelValuePsw: Number(parcelValuePsw),
    chargePsw: Number(chargePsw),
    plannedToBePaidPsw: Number(plannedToBePaidPsw),
    method: input.method,
    createdBy: input.createdBy ?? null,
    cashierSessionId: input.cashierSessionId ?? null,
  });
  return { id: created.id };
}

export async function updateParcelSvc(
  id: string,
  patch: {
    status?: number;
    parcelDetails?: string;
    parcelContent?: string;
    secondReceiverId?: string | null;
    cardId?: string | null;
    cardNumber?: string | null;
    secondCardId?: string | null;
    secondCardNumber?: string | null;
    confirmedBy?: string | null;
    confirmedAt?: string | null;
    parcelValueCedis?: number | string | null;
    chargeCedis?: number | string | null;
    pickupLocationId?: string | null;
    method?: number;
    taxReportConfirmation?: boolean;
  },
): Promise<{ id: string }> {
  const cur = await getParcelRepo(id);
  if (!cur) throw NotFound('Parcel not found');
  if (patch.status === ParcelStatus.DELIVERED_BY_OFFICE) {
    await assertParcelFullyPaid(id);
  }
  const setPatch: Partial<typeof cur> & { parcelValuePsw?: number } = {};
  if (patch.status !== undefined) setPatch.status = patch.status;
  if (patch.parcelDetails) setPatch.parcelDetails = patch.parcelDetails;
  if (patch.parcelContent) setPatch.parcelContent = patch.parcelContent;
  if (patch.secondReceiverId !== undefined) setPatch.secondReceiverId = patch.secondReceiverId;
  if (patch.cardId !== undefined) setPatch.cardId = patch.cardId;
  if (patch.cardNumber !== undefined) setPatch.cardNumber = patch.cardNumber;
  if (patch.secondCardId !== undefined) setPatch.secondCardId = patch.secondCardId;
  if (patch.secondCardNumber !== undefined) setPatch.secondCardNumber = patch.secondCardNumber;
  if (patch.confirmedBy !== undefined) setPatch.confirmedBy = patch.confirmedBy;
  if (patch.confirmedAt !== undefined) {
    setPatch.confirmedAt = patch.confirmedAt ? new Date(patch.confirmedAt) : null;
  } else if (patch.status === ParcelStatus.DELIVERED_BY_OFFICE && !cur.confirmedAt) {
    setPatch.confirmedAt = new Date();
  }
  if (patch.parcelValueCedis !== undefined)
    setPatch.parcelValuePsw =
      patch.parcelValueCedis != null ? Number(toPesewas(patch.parcelValueCedis)) : 0;
  if (patch.chargeCedis !== undefined)
    setPatch.chargePsw = patch.chargeCedis != null ? Number(toPesewas(patch.chargeCedis)) : 0;
  if (patch.pickupLocationId !== undefined) setPatch.pickupLocationId = patch.pickupLocationId;
  if (patch.method !== undefined) setPatch.method = patch.method;
  if (patch.taxReportConfirmation !== undefined)
    setPatch.taxReportConfirmation = patch.taxReportConfirmation;

  const updated = await updateParcelRepo(id, setPatch);
  if (!updated) throw NotFound('Parcel not found');
  const shouldEndPickupQueue =
    cur.status === ParcelStatus.AWAITING_PICKUP &&
    patch.status !== undefined &&
    patch.status !== ParcelStatus.AWAITING_PICKUP;
  if (shouldEndPickupQueue) {
    await endPickupQueueForParcelSvc({ parcelId: id, endedBy: patch.confirmedBy ?? null });
  }
  return { id: updated.id };
}

export async function markParcelReceivedSvc(
  id: string,
  input: { receivedBy: string; receivedAt?: string; status?: number },
) {
  const cur = await getParcelRepo(id);
  if (!cur) throw NotFound('Parcel not found');
  if (cur.receivedAt) throw Conflict('Parcel already marked received');
  const patch: Partial<typeof cur> = {
    receivedBy: input.receivedBy,
    receivedAt: input.receivedAt ? new Date(input.receivedAt) : new Date(),
  };
  if (input.status !== undefined) patch.status = input.status;
  const updated = await updateParcelRepo(id, patch);
  if (!updated) throw NotFound('Parcel not found');
  return { id: updated.id, receivedAt: (patch.receivedAt as Date).toISOString() };
}

export async function setPlannedToBePaidSvc(id: string, plannedCedis: number | string) {
  const cur = await getParcelRepo(id);
  if (!cur) throw NotFound('Parcel not found');
  const plannedToBePaidPsw = toPesewas(plannedCedis);
  const updated = await updateParcelRepo(id, { plannedToBePaidPsw: Number(plannedToBePaidPsw) });
  if (!updated) throw NotFound('Parcel not found');
  return { id: updated.id, plannedToBePaidCedis: Number(plannedToBePaidPsw) / 100 };
}

export async function softDeleteParcelSvc(input: {
  parcelId: string;
  actorUserId: string;
  reason: string;
}) {
  const reason = input.reason.trim();
  if (!reason) {
    throw BadRequest('Deletion reason is required');
  }

  return db.transaction(async (tx) => {
    const parcel = await getParcelSvc(input.parcelId, tx);
    if (parcel.isDeleted) {
      throw BadRequest('Parcel is already deleted');
    }
    if (
      parcel.status !== ParcelStatus.CREATED &&
      parcel.status !== ParcelStatus.PROCESSED &&
      parcel.status !== ParcelStatus.CANCELLED
    ) {
      throw BadRequest('Only created, processed, or cancelled parcels can be deleted');
    }

    const allPayments = await listAllPaymentsForParcelRepo(input.parcelId, tx);
    const activePaymentIds = allPayments
      .filter((payment) => !payment.voidedAt)
      .map((payment) => payment.id);

    const voidedNow = await softVoidPaymentsByIdsRepo(
      activePaymentIds,
      input.actorUserId,
      reason,
      tx,
    );

    const updated = await updateParcelRepo(
      input.parcelId,
      {
        isDeleted: true,
        deletedBy: input.actorUserId,
        deletedAt: new Date(),
        deleteReason: reason,
      },
      tx,
    );
    if (!updated) {
      throw NotFound('Parcel not found');
    }

    const refreshedPayments = await listAllPaymentsForParcelRepo(input.parcelId, tx);
    const totalPayments = refreshedPayments.length;
    const totalVoidedPayments = refreshedPayments.filter((payment) =>
      Boolean(payment.voidedAt),
    ).length;
    const allPaymentsVoided = totalPayments > 0 ? totalVoidedPayments === totalPayments : true;

    await recordAuditLog({
      companyId: parcel.companyId,
      actorUserId: input.actorUserId,
      entityType: 'parcel',
      entityId: parcel.id,
      action: 'PARCEL_SOFT_DELETED',
      message: `Parcel ${parcel.trackingCode} soft-deleted`,
      metadata: {
        reason,
        bookingCode: parcel.bookingCode,
        trackingCode: parcel.trackingCode,
        statusAtDelete: parcel.status,
        paymentSummary: {
          totalPayments,
          voidedNow,
          totalVoidedPayments,
          allPaymentsVoided,
        },
      },
    });

    return {
      id: parcel.id,
      bookingCode: parcel.bookingCode,
      trackingCode: parcel.trackingCode,
      reason,
      payments: {
        total: totalPayments,
        voidedNow,
        totalVoided: totalVoidedPayments,
        allVoided: allPaymentsVoided,
      },
    };
  });
}

export async function getParcelFullDetailsSvc(id: string) {
  const parcel = await getParcelSvc(id);
  const [payments, delivery, consignments, pickupQueue, internalHolder] = await Promise.all([
    (async () => {
      try {
        return await listPaymentsForParcelRepo(id);
      } catch (error) {
        if (isSchemaCompatibilityError(error)) return [];
        throw error;
      }
    })(),
    (async () => {
      try {
        return await getDeliveryByParcelRepo(id);
      } catch (error) {
        if (isSchemaCompatibilityError(error)) return null;
        throw error;
      }
    })(),
    (async () => {
      try {
        return await listConsignmentsForParcelRepo(id);
      } catch (error) {
        if (isSchemaCompatibilityError(error)) return [];
        throw error;
      }
    })(),
    (async () => {
      try {
        return await getPickupQueueByParcelRepo(id);
      } catch (error) {
        if (isSchemaCompatibilityError(error)) return null;
        throw error;
      }
    })(),
    (async () => {
      try {
        return await getParcelInternalHolderByParcelRepo(id);
      } catch (error) {
        if (isSchemaCompatibilityError(error)) return null;
        throw error;
      }
    })(),
  ]);

  return {
    parcel,
    payments,
    delivery,
    consignments,
    pickupQueue,
    internalHolder,
  };
}

export async function logParcelDiscrepancySvc(input: {
  companyId: string;
  actorUserId?: string | null;
  parcelId?: string | null;
  trackingCode?: string | null;
  bookingCode?: string | null;
  discrepancyType: 'record_not_physical' | 'physical_missing_in_system';
  notes?: string | null;
  branchId?: string | null;
}) {
  const parcel = input.parcelId ? await getParcelRepo(input.parcelId) : null;

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId ?? null,
    entityType: 'parcel_discrepancy',
    entityId: input.parcelId ?? null,
    action: 'PARCEL_DISCREPANCY_LOGGED',
    message:
      input.discrepancyType === 'record_not_physical'
        ? 'Incoming in-transit parcel exists in system but is not physical'
        : 'Incoming in-transit parcel is physical but missing in the system',
    metadata: {
      branchId: input.branchId ?? parcel?.destinationId ?? null,
      parcelId: input.parcelId ?? null,
      trackingCode: input.trackingCode ?? parcel?.trackingCode ?? null,
      bookingCode: input.bookingCode ?? parcel?.bookingCode ?? null,
      discrepancyType: input.discrepancyType,
      notes: input.notes?.trim() || null,
      parcelStatus: parcel?.status ?? null,
      destinationId: parcel?.destinationId ?? null,
      sourceId: parcel?.sourceId ?? null,
    },
  });

  return { success: true };
}
