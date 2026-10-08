import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, users } from '@/db/schemas';
import { ParcelStorageClearanceStatus } from '@/db/schemas/enums';
import {
  getCurrentStorageAccrual,
  getStorageClearanceForCompany,
} from './parcel-storage-clearance.helpers';

export async function getParcelStorageClearanceDetailSvc(input: {
  id: string;
  companyId: string;
  branchId?: string | null;
}) {
  const request = await getStorageClearanceForCompany(
    input.id,
    input.companyId,
    undefined,
    false,
    input.branchId,
  );
  const [{ clearableDays, snapshot, policy, settlement }, history] = await Promise.all([
    getCurrentStorageAccrual(request.parcelId),
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        actorName: users.fullname,
        createdAt: auditLogs.createdAt,
        metadata: auditLogs.metadata,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorUserId, users.id))
      .where(
        and(
          eq(auditLogs.companyId, input.companyId),
          eq(auditLogs.entityId, request.id),
          eq(auditLogs.entityType, 'parcel_storage_clearance_request'),
        ),
      )
      .orderBy(asc(auditLogs.createdAt), asc(auditLogs.id)),
  ]);
  return {
    request,
    accruedDays: clearableDays,
    totalAccruedDays: snapshot.storageChargeDays,
    dailyRatePsw: policy.storageFeePerDayPsw,
    outstandingPsw: settlement.outstandingPsw,
    paidPsw: settlement.paidPsw,
    waivedPsw: settlement.waivedPsw,
    remainingDays:
      request.status === ParcelStorageClearanceStatus.EXECUTED ||
      request.status === ParcelStorageClearanceStatus.REJECTED
        ? clearableDays
        : Math.max(clearableDays - request.requestedDays, 0),
    history,
  };
}
