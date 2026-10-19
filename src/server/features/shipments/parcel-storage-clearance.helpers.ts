import type { ParcelRow } from './parcels.repository';
import { NotFound, BadRequest } from '@/server/utils/http-error';
import {
  computeParcelAgeingSnapshot,
  getCompanyParcelAgeingPolicy,
  getParcelSvc,
  getParcelStorageSettlementSvc,
} from './parcels.service';
import {
  getParcelStorageClearanceRepo,
  type DbExecutor,
} from './parcel-storage-clearance.repository';
import { getStorageClearanceDaysError } from './parcel-storage-clearance.rules';

export function normalizeStorageClearanceEvidence(value?: string | null) {
  const normalized = value?.trim() ?? '';
  return normalized || null;
}

export function validateStorageClearanceReason(value: string) {
  const normalized = value.trim();
  if (normalized.length < 3 || normalized.length > 1000)
    throw BadRequest('A reason of 3–1000 characters is required');
  return normalized;
}

export async function getCurrentStorageAccrual(parcelId: string, executor?: DbExecutor) {
  const parcel = await getParcelSvc(parcelId, executor);
  const policy = await getCompanyParcelAgeingPolicy(parcel.companyId);
  const snapshot = computeParcelAgeingSnapshot({
    status: parcel.status,
    receivedAt: parcel.receivedAt,
    policy,
    now: new Date(),
  });
  const settlement = await getParcelStorageSettlementSvc(parcelId, executor);
  const clearableDays = Math.ceil(settlement.outstandingPsw / policy.storageFeePerDayPsw);
  return { parcel, policy, snapshot, settlement, clearableDays };
}

export function assertStorageClearanceDays(input: { requestedDays: number; accruedDays: number }) {
  const error = getStorageClearanceDaysError(input);
  if (!error) return;
  throw BadRequest(error);
}

export async function getStorageClearanceForCompany(
  id: string,
  companyId: string,
  executor?: DbExecutor,
  lock = false,
  branchId?: string | null,
) {
  const request = await getParcelStorageClearanceRepo(id, executor, lock);
  if (!request || request.companyId !== companyId) {
    throw NotFound('Storage clearance request not found');
  }
  const parcel = await getParcelSvc(request.parcelId, executor);
  assertStorageClearanceScope(parcel, { companyId, branchId });
  return request;
}

export function assertStorageClearanceScope(
  parcel: ParcelRow,
  scope: { companyId: string; branchId?: string | null },
) {
  if (
    parcel.companyId !== scope.companyId ||
    parcel.isDeleted ||
    parcel.deletedAt ||
    (scope.branchId &&
      parcel.destinationId !== scope.branchId &&
      parcel.sourceId !== scope.branchId)
  ) {
    throw NotFound('Parcel not found');
  }
}
