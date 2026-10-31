import { toPesewas } from '@/server/utils/gh-money';
import {
  ParcelReconciliationActionType,
  ParcelReconciliationCaseStatus,
  ParcelReconciliationCaseType,
  PaymentMethod,
} from '@/db/schemas';
import { BadRequest, Conflict, NotFound } from '../../../utils/http-error';
import { recordAuditLog } from '../../audit/logger';
import {
  createParcelReconciliationCaseRepo,
  getOpenParcelReconciliationCaseByParcelRepo,
  listEligibleParcelCorrectionSessionsRepo,
} from '../parcel-reconciliation-cases.repository';
import { type ParcelRow } from '../parcels.repository';
import { isParcelEligibleForReconciliation } from '../parcel-reconciliation-eligibility';
import { getParcelChargeValidationError } from '@/shared/shipments/parcel-charge-policy';
import {
  assertCaseType,
  assertActionType,
  isAmountCorrectionCaseType,
  isOriginalSessionAmountCorrection,
} from './helpers';
import { getParcelSvc } from './queries';

export async function requestParcelReconciliationCaseSvc(input: {
  companyId: string;
  actorUserId: string;
  parcelId: string;
  linkedParcelId?: string | null;
  caseType: number;
  notes: string;
  evidenceUrl?: string | null;
  actionType?: number | null;
  cashierSessionId?: string | null;
  correctedChargeCedis?: number | string | null;
  correctedPlannedToBePaidCedis?: number | string | null;
}) {
  const caseType = assertCaseType(input.caseType);
  const note = input.notes.trim();
  if (!note) throw BadRequest('Case note is required');

  const parcel = await getParcelSvc(input.parcelId);
  if (parcel.companyId !== input.companyId) throw NotFound('Parcel not found in company');
  if (parcel.isDeleted) throw BadRequest('Cannot open case for a deleted parcel');

  if (!isParcelEligibleForReconciliation(parcel.status)) {
    throw BadRequest('Delivered parcels require finance exception handling');
  }

  const existingOpen = await getOpenParcelReconciliationCaseByParcelRepo(input.parcelId);
  if (existingOpen) throw Conflict('An open reconciliation case already exists for this parcel');

  let linkedParcel: ParcelRow | null = null;
  if (input.linkedParcelId) {
    linkedParcel = await getParcelSvc(input.linkedParcelId);
    if (linkedParcel.companyId !== input.companyId) {
      throw BadRequest('Linked parcel does not belong to this company');
    }
    if (linkedParcel.id === parcel.id) throw BadRequest('Linked parcel must be different');
    if (!isParcelEligibleForReconciliation(linkedParcel.status)) {
      throw BadRequest('Delivered parcels require finance exception handling');
    }
  }

  if (caseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY && !linkedParcel) {
    throw BadRequest('Duplicate entry case requires a linked parcel');
  }
  if (caseType !== ParcelReconciliationCaseType.DUPLICATE_ENTRY && linkedParcel) {
    throw BadRequest('Linked parcel is only valid for duplicate entry cases');
  }

  const actionType = input.actionType != null ? assertActionType(input.actionType) : null;
  if (isOriginalSessionAmountCorrection(actionType) && !isAmountCorrectionCaseType(caseType)) {
    throw BadRequest(
      'Original-session amount correction requires a wrong amount or data entry case',
    );
  }
  if (
    caseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY &&
    actionType != null &&
    actionType !== ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE &&
    actionType !== ParcelReconciliationActionType.MERGE_TO_SINGLE
  ) {
    throw BadRequest('Duplicate entry supports only duplicate-resolution actions');
  }

  let correction:
    | {
        cashierSessionId: string;
        effectiveAt: Date;
        proposedChargePsw: number;
        proposedPlannedToBePaidPsw: number;
        sessionStatus: string;
      }
    | undefined;

  if (isOriginalSessionAmountCorrection(actionType)) {
    if (parcel.method === PaymentMethod.CREDIT || parcel.chargePsw === 0)
      throw Conflict(
        'Zero-charge corrections require Request charge correction and independent charge approval',
      );
    if (!input.cashierSessionId) throw BadRequest('Original cashier session is required');
    if (!parcel.createdBy) throw BadRequest('Parcel has no originating cashier to reconcile');

    const proposedChargeCedis = Number(input.correctedChargeCedis);
    const proposedPlannedToBePaidCedis = Number(input.correctedPlannedToBePaidCedis ?? 0);
    const validationError = getParcelChargeValidationError({
      chargeCedis: proposedChargeCedis,
      plannedToBePaidCedis: proposedPlannedToBePaidCedis,
    });
    if (validationError) throw BadRequest(validationError);

    const eligibleSessions = await listEligibleParcelCorrectionSessionsRepo({
      cashierId: parcel.createdBy,
      branchId: parcel.sourceId,
      occurredAt: parcel.createdAt,
      preferredSessionId: parcel.cashierSessionId,
    });
    const selectedSession = eligibleSessions.find(
      (session) => session.id === input.cashierSessionId,
    );
    if (!selectedSession) {
      throw BadRequest(
        'Selected session does not match the parcel cashier, branch, and transaction time',
      );
    }

    correction = {
      cashierSessionId: selectedSession.id,
      effectiveAt: parcel.createdAt,
      proposedChargePsw: Number(toPesewas(proposedChargeCedis)),
      proposedPlannedToBePaidPsw: Number(toPesewas(proposedPlannedToBePaidCedis)),
      sessionStatus: selectedSession.status,
    };
    if (
      correction.proposedChargePsw === parcel.chargePsw &&
      correction.proposedPlannedToBePaidPsw === parcel.plannedToBePaidPsw
    ) {
      throw BadRequest('Corrected amounts must be different from the current parcel amounts');
    }
  }

  const created = await createParcelReconciliationCaseRepo({
    companyId: input.companyId,
    parcelId: parcel.id,
    linkedParcelId: linkedParcel?.id ?? null,
    cashierSessionId: correction?.cashierSessionId ?? parcel.cashierSessionId ?? null,
    effectiveAt: correction?.effectiveAt ?? parcel.createdAt,
    originalChargePsw: parcel.chargePsw,
    proposedChargePsw: correction?.proposedChargePsw ?? null,
    originalPlannedToBePaidPsw: parcel.plannedToBePaidPsw,
    proposedPlannedToBePaidPsw: correction?.proposedPlannedToBePaidPsw ?? null,
    caseType,
    actionType,
    status: ParcelReconciliationCaseStatus.REQUESTED,
    notes: note,
    evidenceUrl: input.evidenceUrl?.trim() || null,
    requestedBy: input.actorUserId,
  });
  if (!created) throw BadRequest('Failed to create reconciliation case');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'parcel_reconciliation_case',
    entityId: created.id,
    action: 'PARCEL_RECONCILIATION_CASE_REQUESTED',
    message: `Reconciliation case requested for parcel ${parcel.trackingCode}`,
    metadata: {
      parcelId: parcel.id,
      linkedParcelId: linkedParcel?.id ?? null,
      trackingCode: parcel.trackingCode,
      linkedTrackingCode: linkedParcel?.trackingCode ?? null,
      caseType,
      actionType,
      notes: note,
      evidenceUrl: input.evidenceUrl?.trim() || null,
      correction: correction
        ? {
            cashierSessionId: correction.cashierSessionId,
            effectiveAt: correction.effectiveAt.toISOString(),
            sessionStatus: correction.sessionStatus,
            originalChargePsw: parcel.chargePsw,
            proposedChargePsw: correction.proposedChargePsw,
            originalPlannedToBePaidPsw: parcel.plannedToBePaidPsw,
            proposedPlannedToBePaidPsw: correction.proposedPlannedToBePaidPsw,
          }
        : null,
    },
  });

  return { id: created.id };
}
