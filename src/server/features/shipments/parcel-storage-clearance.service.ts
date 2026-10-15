import { db } from '@/db/config';
import { Conflict, NotFound } from '@/server/utils/http-error';
import { ParcelStorageClearanceStatus } from '@/db/schemas/enums';
import { recordStorageClearanceAudit } from './parcel-storage-clearance-audit';
import {
  lockStorageClearanceParcelRepo,
  createParcelStorageClearanceRepo,
  getOpenParcelStorageClearanceRepo,
  updateParcelStorageClearanceRepo,
} from './parcel-storage-clearance.repository';
import {
  assertStorageClearanceDays,
  getCurrentStorageAccrual,
  getStorageClearanceForCompany,
  normalizeStorageClearanceEvidence,
  assertStorageClearanceScope,
  validateStorageClearanceReason,
} from './parcel-storage-clearance.helpers';

export async function createParcelStorageClearanceSvc(input: {
  companyId: string;
  branchId?: string | null;
  parcelId: string;
  actorUserId: string;
  requestedDays?: number | null;
  clearAll?: boolean;
  reason: string;
  evidenceUrl?: string | null;
}) {
  return db.transaction(async (tx) => {
    await lockStorageClearanceParcelRepo(input.parcelId, tx);
    const { parcel, policy, clearableDays, settlement } = await getCurrentStorageAccrual(
      input.parcelId,
      tx,
    );
    assertStorageClearanceScope(parcel, input);
    if (clearableDays <= 0) {
      throw Conflict('There are no accrued storage days to clear');
    }
    if (await getOpenParcelStorageClearanceRepo(input.parcelId, tx)) {
      throw Conflict('This parcel already has an open storage clearance request');
    }

    const reason = validateStorageClearanceReason(input.reason);
    const clearAll = input.clearAll === true;
    const requestedDays = clearAll ? clearableDays : Number(input.requestedDays ?? 0);
    assertStorageClearanceDays({ requestedDays, accruedDays: clearableDays });
    const requestedAmountPsw = clearAll
      ? settlement.outstandingPsw
      : requestedDays * policy.storageFeePerDayPsw;
    const created = await createParcelStorageClearanceRepo(
      {
        companyId: input.companyId,
        parcelId: input.parcelId,
        status: ParcelStorageClearanceStatus.PENDING_APPROVAL,
        requestedDays,
        accruedDaysAtRequest: clearableDays,
        dailyRatePsw: policy.storageFeePerDayPsw,
        requestedAmountPsw,
        clearAll,
        reason,
        evidenceUrl: normalizeStorageClearanceEvidence(input.evidenceUrl),
        requestedBy: input.actorUserId,
        requestedAt: new Date(),
      },
      tx,
    );
    if (!created) throw Conflict('Failed to create storage clearance request');

    await recordStorageClearanceAudit(tx, {
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      entityType: 'parcel_storage_clearance_request',
      entityId: created.id,
      action: 'PARCEL_STORAGE_CLEARANCE_REQUESTED',
      message: `Storage clearance requested for ${parcel.trackingCode}`,
      metadata: { requestedDays, requestedAmountPsw, clearAll, reason },
    });

    return { id: created.id };
  });
}

export async function resubmitParcelStorageClearanceSvc(input: {
  companyId: string;
  branchId?: string | null;
  requestId: string;
  actorUserId: string;
  requestedDays?: number | null;
  clearAll?: boolean;
  reason: string;
  evidenceUrl?: string | null;
}) {
  return db.transaction(async (tx) => {
    const existing = await getStorageClearanceForCompany(
      input.requestId,
      input.companyId,
      tx,
      true,
      input.branchId,
    );
    if (existing.status !== ParcelStorageClearanceStatus.RETURNED_FOR_REVIEW) {
      throw Conflict('Only returned storage clearance requests can be resubmitted');
    }
    if (existing.requestedBy !== input.actorUserId) {
      throw Conflict('Only the original requester can resubmit this storage clearance');
    }

    await lockStorageClearanceParcelRepo(existing.parcelId, tx);
    const { parcel, policy, clearableDays, settlement } = await getCurrentStorageAccrual(
      existing.parcelId,
      tx,
    );
    if (clearableDays <= 0) {
      throw Conflict('There are no accrued storage days to clear');
    }
    const clearAll = input.clearAll === true;
    const requestedDays = clearAll ? clearableDays : Number(input.requestedDays ?? 0);
    assertStorageClearanceDays({ requestedDays, accruedDays: clearableDays });
    const reason = validateStorageClearanceReason(input.reason);
    const updated = await updateParcelStorageClearanceRepo(
      input.requestId,
      {
        status: ParcelStorageClearanceStatus.PENDING_APPROVAL,
        requestedDays,
        accruedDaysAtRequest: clearableDays,
        dailyRatePsw: policy.storageFeePerDayPsw,
        requestedAmountPsw: clearAll
          ? settlement.outstandingPsw
          : requestedDays * policy.storageFeePerDayPsw,
        clearAll,
        reason,
        evidenceUrl: normalizeStorageClearanceEvidence(input.evidenceUrl),
        requestedAt: new Date(),
        approvedBy: null,
        approvedAt: null,
        approvalNote: null,
        returnedBy: null,
        returnedAt: null,
        returnNote: null,
      },
      tx,
    );
    if (!updated) throw NotFound('Storage clearance request not found');

    await recordStorageClearanceAudit(tx, {
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      entityType: 'parcel_storage_clearance_request',
      entityId: input.requestId,
      action: 'PARCEL_STORAGE_CLEARANCE_RESUBMITTED',
      message: `Storage clearance resubmitted for ${parcel.trackingCode}`,
      metadata: { requestedDays, clearAll, reason, previousRequest: existing },
    });
    return { id: input.requestId };
  });
}

export async function approveParcelStorageClearanceSvc(input: {
  companyId: string;
  branchId?: string | null;
  requestId: string;
  actorUserId: string;
  note?: string | null;
}) {
  return db.transaction(async (tx) => {
    const request = await getStorageClearanceForCompany(
      input.requestId,
      input.companyId,
      tx,
      true,
      input.branchId,
    );
    if (request.status !== ParcelStorageClearanceStatus.PENDING_APPROVAL) {
      throw Conflict('Only pending storage clearance requests can be approved');
    }
    if (request.requestedBy === input.actorUserId) {
      throw Conflict('The requester cannot approve the same storage clearance');
    }
    await lockStorageClearanceParcelRepo(request.parcelId, tx);
    const { parcel, clearableDays } = await getCurrentStorageAccrual(request.parcelId, tx);
    if (clearableDays <= 0) {
      throw Conflict('There are no accrued storage days to clear');
    }
    const updated = await updateParcelStorageClearanceRepo(
      input.requestId,
      {
        status: ParcelStorageClearanceStatus.APPROVED_FOR_FINANCE,
        approvedBy: input.actorUserId,
        approvedAt: new Date(),
        approvalNote: input.note?.trim() || null,
      },
      tx,
    );
    if (!updated) throw NotFound('Storage clearance request not found');
    await recordStorageClearanceAudit(tx, {
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      entityType: 'parcel_storage_clearance_request',
      entityId: input.requestId,
      action: 'PARCEL_STORAGE_CLEARANCE_APPROVED',
      message: `Storage clearance approved for ${parcel.trackingCode}`,
      metadata: { requestedDays: request.requestedDays, note: input.note ?? null },
    });
    return { id: input.requestId };
  });
}

export async function rejectParcelStorageClearanceSvc(input: {
  companyId: string;
  branchId?: string | null;
  requestId: string;
  actorUserId: string;
  note: string;
  expectedStatus?: number;
}) {
  return db.transaction(async (tx) => {
    const request = await getStorageClearanceForCompany(
      input.requestId,
      input.companyId,
      tx,
      true,
      input.branchId,
    );
    if (
      request.status !== ParcelStorageClearanceStatus.PENDING_APPROVAL &&
      request.status !== ParcelStorageClearanceStatus.APPROVED_FOR_FINANCE
    ) {
      throw Conflict('This storage clearance request cannot be rejected');
    }
    if (input.expectedStatus != null && request.status !== input.expectedStatus)
      throw Conflict('Request changed; refresh and review it again');
    const note = validateStorageClearanceReason(input.note);
    const updated = await updateParcelStorageClearanceRepo(
      input.requestId,
      {
        status: ParcelStorageClearanceStatus.REJECTED,
        rejectedBy: input.actorUserId,
        rejectedAt: new Date(),
        rejectionNote: note,
      },
      tx,
    );
    if (!updated) throw NotFound('Storage clearance request not found');
    await recordStorageClearanceAudit(tx, {
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      entityType: 'parcel_storage_clearance_request',
      entityId: input.requestId,
      action: 'PARCEL_STORAGE_CLEARANCE_REJECTED',
      message: 'Storage clearance request rejected',
      metadata: { reason: note },
    });
    return { id: input.requestId };
  });
}

export async function returnParcelStorageClearanceForReviewSvc(input: {
  companyId: string;
  branchId?: string | null;
  requestId: string;
  actorUserId: string;
  note: string;
}) {
  return db.transaction(async (tx) => {
    const request = await getStorageClearanceForCompany(
      input.requestId,
      input.companyId,
      tx,
      true,
      input.branchId,
    );
    if (request.status !== ParcelStorageClearanceStatus.APPROVED_FOR_FINANCE) {
      throw Conflict('Only approved storage clearance requests can be returned for review');
    }
    const note = validateStorageClearanceReason(input.note);
    const updated = await updateParcelStorageClearanceRepo(
      input.requestId,
      {
        status: ParcelStorageClearanceStatus.RETURNED_FOR_REVIEW,
        returnedBy: input.actorUserId,
        returnedAt: new Date(),
        returnNote: note,
      },
      tx,
    );
    if (!updated) throw NotFound('Storage clearance request not found');
    await recordStorageClearanceAudit(tx, {
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      entityType: 'parcel_storage_clearance_request',
      entityId: input.requestId,
      action: 'PARCEL_STORAGE_CLEARANCE_RETURNED_FOR_REVIEW',
      message: 'Storage clearance returned for requester review',
      metadata: { reason: note },
    });
    return { id: input.requestId };
  });
}
