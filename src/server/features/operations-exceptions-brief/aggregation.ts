import {
  listOpenParcelDiscrepanciesSvc,
  listParcelReconciliationCasesSvc,
  listParcelsSvc,
  listStuckParcelsSvc,
} from '@/server/features/shipments/parcels.service';
import { listAuditLogsSvc } from '@/server/features/audit/service';
import { safeCall } from '@/server/services/ai-briefs/safe-call';
import { ParcelReconciliationCaseStatus, ParcelReconciliationCaseType } from '@/db/schemas/enums';
import type { OperationsExceptionsBriefScope, GroundingSnapshot, TypeCountFigure } from './dto';

const RECONCILIATION_CASE_TYPE_LABELS: Record<number, string> = {
  [ParcelReconciliationCaseType.SHORTAGE]: 'shortage',
  [ParcelReconciliationCaseType.OVERAGE]: 'overage',
  [ParcelReconciliationCaseType.WRONG_AMOUNT]: 'wrong_amount',
  [ParcelReconciliationCaseType.WRONG_PARCEL_TYPE]: 'wrong_parcel_type',
  [ParcelReconciliationCaseType.DUPLICATE_ENTRY]: 'duplicate_entry',
  [ParcelReconciliationCaseType.CUSTOMER_CANCELLATION_BEFORE_DELIVERY]:
    'customer_cancellation_before_delivery',
  [ParcelReconciliationCaseType.DATA_ENTRY_ERROR]: 'data_entry_error',
};

const STUCK_AFTER_DAYS_DEFAULT = 5;
const MISROUTED_SCAN_AUDIT_ACTION = 'CONSIGNMENT_ITEM_WRONG_CONSIGNMENT_SCAN';

function countByType(items: { type: string }[]): TypeCountFigure[] {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item.type, (counts.get(item.type) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));
}

export async function buildOperationsExceptionsGroundingSnapshot(
  scope: OperationsExceptionsBriefScope,
): Promise<GroundingSnapshot> {
  const { companyId, branchId, from, to } = scope;

  const [discrepancies, reconciliationCases, agedParcels, storageAccruing, misroutedScans, stuck] =
    await Promise.all([
      safeCall('open parcel discrepancies', () =>
        listOpenParcelDiscrepanciesSvc({ companyId, branchId, limit: 200, offset: 0 }),
      ),
      safeCall('parcel reconciliation cases', () =>
        listParcelReconciliationCasesSvc({
          companyId,
          branchId,
          statuses: [
            ParcelReconciliationCaseStatus.REQUESTED,
            ParcelReconciliationCaseStatus.APPROVED,
          ],
          limit: 200,
          offset: 0,
        }),
      ),
      safeCall('aged parcels', () =>
        listParcelsSvc({
          companyId,
          destinationId: branchId ?? null,
          agedOnly: true,
          limit: 1,
          offset: 0,
        }),
      ),
      safeCall('storage-charge-accruing parcels', () =>
        listParcelsSvc({
          companyId,
          destinationId: branchId ?? null,
          storageChargeAccruing: true,
          limit: 1,
          offset: 0,
        }),
      ),
      safeCall('misrouted consignment scans', () =>
        listAuditLogsSvc({
          companyId,
          action: MISROUTED_SCAN_AUDIT_ACTION,
          from,
          to,
          limit: 1,
          offset: 0,
        }),
      ),
      safeCall('stuck parcels', () =>
        listStuckParcelsSvc({
          companyId,
          branchId,
          stuckAfterDays: STUCK_AFTER_DAYS_DEFAULT,
          limit: 1,
          offset: 0,
        }),
      ),
    ]);

  return {
    periodFrom: from,
    periodTo: to,
    branchId: branchId ?? null,
    openDiscrepancyCount: discrepancies?.totalRecords ?? null,
    openDiscrepancyTypeBreakdown: countByType(
      (discrepancies?.data ?? []).map((row) => ({ type: row.discrepancyType })),
    ),
    openReconciliationCaseCount: reconciliationCases?.totalRecords ?? null,
    reconciliationCaseTypeBreakdown: countByType(
      (reconciliationCases?.data ?? []).map((row) => ({
        type: RECONCILIATION_CASE_TYPE_LABELS[row.caseType] ?? `unknown_${row.caseType}`,
      })),
    ),
    agedParcelCount: agedParcels?.totalRecords ?? null,
    storageChargeAccruingCount: storageAccruing?.totalRecords ?? null,
    misroutedScanCount: misroutedScans?.totalRecords ?? null,
    stuckParcelCount: stuck?.totalRecords ?? null,
    stuckAfterDays: STUCK_AFTER_DAYS_DEFAULT,
    dataCompleteness: {
      openDiscrepancies: discrepancies !== null,
      reconciliationCases: reconciliationCases !== null,
      agedParcels: agedParcels !== null && storageAccruing !== null,
      misroutedScans: misroutedScans !== null,
      stuckParcels: stuck !== null,
    },
  };
}
