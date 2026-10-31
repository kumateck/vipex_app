import {
  ParcelReconciliationActionType,
  ParcelReconciliationCaseStatus,
  ParcelReconciliationCaseType,
} from '@/db/schemas';
import { BadRequest, NotFound } from '../../../utils/http-error';
import { recordAuditLog } from '../../audit/logger';
import {
  getParcelReconciliationCaseRepo,
  listEligibleParcelCorrectionSessionsRepo,
  updateParcelReconciliationCaseRepo,
} from '../parcel-reconciliation-cases.repository';
import { isParcelEligibleForReconciliation } from '../parcel-reconciliation-eligibility';
import {
  assertActionType,
  isAmountCorrectionCaseType,
  isOriginalSessionAmountCorrection,
} from './helpers';
import { getParcelSvc } from './queries';

export async function listEligibleParcelCorrectionSessionsSvc(input: {
  companyId: string;
  parcelId: string;
}) {
  const parcel = await getParcelSvc(input.parcelId);
  if (parcel.companyId !== input.companyId) throw NotFound('Parcel not found in company');
  if (!parcel.createdBy) return [];

  return listEligibleParcelCorrectionSessionsRepo({
    cashierId: parcel.createdBy,
    branchId: parcel.sourceId,
    occurredAt: parcel.createdAt,
    preferredSessionId: parcel.cashierSessionId,
  });
}

export async function approveParcelReconciliationCaseSvc(input: {
  caseId: string;
  companyId: string;
  actorUserId: string;
  actionType: number;
  resolutionNote?: string | null;
}) {
  const actionType = assertActionType(input.actionType);
  const existing = await getParcelReconciliationCaseRepo(input.caseId);
  if (!existing || existing.companyId !== input.companyId) throw NotFound('Case not found');
  if (existing.status !== ParcelReconciliationCaseStatus.REQUESTED) {
    throw BadRequest('Only requested cases can be approved');
  }
  if (existing.requestedBy === input.actorUserId) {
    throw BadRequest('Requester cannot approve the same reconciliation case');
  }
  const involvedParcels = await Promise.all(
    [existing.parcelId, existing.linkedParcelId]
      .filter((parcelId): parcelId is string => parcelId != null)
      .map((parcelId) => getParcelSvc(parcelId)),
  );
  if (involvedParcels.some((parcel) => !isParcelEligibleForReconciliation(parcel.status))) {
    throw BadRequest('Delivered parcels require finance exception handling');
  }
  if (
    existing.caseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY &&
    actionType !== ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE &&
    actionType !== ParcelReconciliationActionType.MERGE_TO_SINGLE
  ) {
    throw BadRequest('Duplicate entry supports only duplicate-resolution actions');
  }
  if (
    existing.caseType !== ParcelReconciliationCaseType.DUPLICATE_ENTRY &&
    (actionType === ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE ||
      actionType === ParcelReconciliationActionType.MERGE_TO_SINGLE)
  ) {
    throw BadRequest('Selected action is only valid for duplicate entry');
  }
  if (
    isOriginalSessionAmountCorrection(actionType) &&
    (!isAmountCorrectionCaseType(existing.caseType) ||
      existing.cashierSessionId == null ||
      existing.proposedChargePsw == null ||
      existing.proposedPlannedToBePaidPsw == null)
  ) {
    throw BadRequest('Case is missing a valid original-session amount correction proposal');
  }

  const note = input.resolutionNote?.trim() || null;
  const updated = await updateParcelReconciliationCaseRepo(input.caseId, {
    status: ParcelReconciliationCaseStatus.APPROVED,
    actionType,
    approvedBy: input.actorUserId,
    approvedAt: new Date(),
    resolutionNote: note,
  });
  if (!updated) throw NotFound('Case not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'parcel_reconciliation_case',
    entityId: input.caseId,
    action: 'PARCEL_RECONCILIATION_CASE_APPROVED',
    message: 'Parcel reconciliation case approved',
    metadata: {
      actionType,
      resolutionNote: note,
    },
  });

  return { id: input.caseId };
}
