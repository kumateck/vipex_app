import { db } from '@/db/config';
import { Conflict, NotFound } from '@/server/utils/http-error';
import { ParcelStorageClearanceStatus } from '@/db/schemas/enums';
import { recordStorageClearanceAudit } from './parcel-storage-clearance-audit';
import { postParcelStorageWaiver } from './parcel-storage-waiver-posting.service';
import {
  lockStorageClearanceParcelRepo,
  updateParcelStorageClearanceRepo,
} from './parcel-storage-clearance.repository';
import {
  getCurrentStorageAccrual,
  getStorageClearanceForCompany,
} from './parcel-storage-clearance.helpers';
import { getStorageClearanceExecutionError } from './parcel-storage-clearance.rules';

export async function executeParcelStorageClearanceSvc(input: {
  companyId: string;
  branchId?: string | null;
  requestId: string;
  actorUserId: string;
  note?: string | null;
}) {
  const result = await db.transaction(async (tx) => {
    const request = await getStorageClearanceForCompany(
      input.requestId,
      input.companyId,
      tx,
      true,
      input.branchId,
    );
    if (request.status !== ParcelStorageClearanceStatus.APPROVED_FOR_FINANCE) {
      throw Conflict('Only approved storage clearance requests can be executed');
    }
    if (request.requestedBy === input.actorUserId) {
      throw Conflict('The requester cannot execute the same storage clearance');
    }
    await lockStorageClearanceParcelRepo(request.parcelId, tx);
    const { parcel, policy, clearableDays, settlement } = await getCurrentStorageAccrual(
      request.parcelId,
      tx,
    );
    const error = getStorageClearanceExecutionError({
      requestedAmountPsw: request.requestedAmountPsw,
      requestedDays: request.requestedDays,
      accruedDays: clearableDays,
      clearAll: request.clearAll,
      requestedRatePsw: request.dailyRatePsw,
      currentRatePsw: policy.storageFeePerDayPsw,
      outstandingPsw: settlement.outstandingPsw,
    });
    if (error) throw Conflict(error);
    const amountPsw = request.requestedAmountPsw;
    const posting = await postParcelStorageWaiver(
      {
        parcelId: request.parcelId,
        actorUserId: input.actorUserId,
        parcel,
        reason: request.reason,
        amountPsw,
      },
      tx,
    );
    const updated = await updateParcelStorageClearanceRepo(
      input.requestId,
      {
        status: ParcelStorageClearanceStatus.EXECUTED,
        executedBy: input.actorUserId,
        executedAt: new Date(),
        executedDays: request.requestedDays,
        executedAmountPsw: amountPsw,
        accountingJournalEntryId: posting?.journalEntryId ?? null,
        accountingPostedAt: posting?.postedAt ?? null,
      },
      tx,
    );
    if (!updated) throw NotFound('Storage clearance request not found');
    await recordStorageClearanceAudit(tx, {
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      entityType: 'parcel_storage_clearance_request',
      entityId: input.requestId,
      action: 'PARCEL_STORAGE_CLEARANCE_EXECUTED',
      message: 'Storage clearance executed',
      metadata: {
        executedDays: request.requestedDays,
        executedAmountPsw: amountPsw,
        note: input.note ?? null,
      },
    });
    return {
      id: input.requestId,
      executedDays: request.requestedDays,
      executedAmountPsw: amountPsw,
    };
  });

  return result;
}
