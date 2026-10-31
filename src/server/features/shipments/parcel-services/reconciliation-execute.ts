import {
  ParcelReconciliationCaseStatus,
  ParcelReconciliationCaseType,
  ParcelStatus,
  PaymentMethod,
} from '@/db/schemas';
import { db } from '@/db/config';
import { BadRequest, Conflict, NotFound } from '../../../utils/http-error';
import {
  listAllPaymentsForParcelRepo,
  listPaymentsForParcelRepo,
  softVoidPaymentsByIdsRepo,
} from '../../payments/repository';
import { recordAuditLog } from '../../audit/logger';
import { removeActiveConsignmentItemsByParcelRepo } from '../consignments.repository';
import {
  getParcelReconciliationCaseRepo,
  updateParcelReconciliationCaseRepo,
} from '../parcel-reconciliation-cases.repository';
import { updateParcelRepo, type ParcelRow } from '../parcels.repository';
import { isParcelEligibleForReconciliation } from '../parcel-reconciliation-eligibility';
import { isNonEmptyText, assertActionType, isOriginalSessionAmountCorrection } from './helpers';
import { getParcelSvc } from './queries';

export async function executeParcelReconciliationCaseSvc(input: {
  caseId: string;
  companyId: string;
  actorUserId: string;
  executionNote?: string | null;
}) {
  return db.transaction(async (tx) => {
    const existing = await getParcelReconciliationCaseRepo(input.caseId, tx);
    if (!existing || existing.companyId !== input.companyId) throw NotFound('Case not found');
    if (existing.status !== ParcelReconciliationCaseStatus.APPROVED) {
      throw BadRequest('Only approved cases can be executed');
    }
    if (existing.actionType == null) throw BadRequest('Case action is not set');
    const actionType = assertActionType(existing.actionType);
    const primaryParcel = await getParcelSvc(existing.parcelId, tx);
    const linkedParcel = existing.linkedParcelId
      ? await getParcelSvc(existing.linkedParcelId, tx)
      : null;
    if (
      !isParcelEligibleForReconciliation(primaryParcel.status) ||
      (linkedParcel != null && !isParcelEligibleForReconciliation(linkedParcel.status))
    ) {
      throw BadRequest('Delivered parcels require finance exception handling');
    }
    const targetParcels: ParcelRow[] = [];

    if (isOriginalSessionAmountCorrection(actionType)) {
      if (primaryParcel.method === PaymentMethod.CREDIT || primaryParcel.chargePsw === 0)
        throw Conflict(
          'Zero-charge corrections require Request charge correction and independent charge approval',
        );
      if (
        existing.originalChargePsw == null ||
        existing.proposedChargePsw == null ||
        existing.originalPlannedToBePaidPsw == null ||
        existing.proposedPlannedToBePaidPsw == null ||
        existing.cashierSessionId == null
      ) {
        throw BadRequest('Correction proposal is incomplete');
      }
      if (
        primaryParcel.chargePsw !== existing.originalChargePsw ||
        primaryParcel.plannedToBePaidPsw !== existing.originalPlannedToBePaidPsw
      ) {
        throw Conflict('Parcel amounts changed after this case was requested; open a new case');
      }

      const activePayments = await listPaymentsForParcelRepo(primaryParcel.id, tx);
      if (activePayments.length > 0) {
        throw BadRequest(
          'Paid parcels require the void, refund, or rebook workflow; direct amount correction is not allowed',
        );
      }

      await updateParcelRepo(
        primaryParcel.id,
        {
          chargePsw: existing.proposedChargePsw,
          plannedToBePaidPsw: existing.proposedPlannedToBePaidPsw,
        },
        tx,
      );

      const executionNote = input.executionNote?.trim() || existing.resolutionNote;
      await updateParcelReconciliationCaseRepo(
        existing.id,
        {
          status: ParcelReconciliationCaseStatus.EXECUTED,
          executedBy: input.actorUserId,
          executedAt: new Date(),
          resolutionNote: executionNote,
          metadata: {
            ...(existing.metadata as Record<string, unknown> | null),
            execution: {
              actionType,
              effectiveCashierSessionId: existing.cashierSessionId,
              effectiveAt:
                existing.effectiveAt?.toISOString() ?? primaryParcel.createdAt.toISOString(),
              recordedAt: new Date().toISOString(),
              before: {
                chargePsw: existing.originalChargePsw,
                plannedToBePaidPsw: existing.originalPlannedToBePaidPsw,
              },
              after: {
                chargePsw: existing.proposedChargePsw,
                plannedToBePaidPsw: existing.proposedPlannedToBePaidPsw,
              },
            },
          },
        },
        tx,
      );

      await recordAuditLog({
        companyId: input.companyId,
        actorUserId: input.actorUserId,
        entityType: 'parcel_reconciliation_case',
        entityId: existing.id,
        action: 'PARCEL_AMOUNT_CORRECTION_EXECUTED',
        message: `Parcel ${primaryParcel.trackingCode} amount corrected in its original cashier session`,
        metadata: {
          parcelId: primaryParcel.id,
          bookingCode: primaryParcel.bookingCode,
          trackingCode: primaryParcel.trackingCode,
          effectiveCashierSessionId: existing.cashierSessionId,
          effectiveAt: existing.effectiveAt?.toISOString() ?? primaryParcel.createdAt.toISOString(),
          before: {
            chargePsw: existing.originalChargePsw,
            plannedToBePaidPsw: existing.originalPlannedToBePaidPsw,
          },
          after: {
            chargePsw: existing.proposedChargePsw,
            plannedToBePaidPsw: existing.proposedPlannedToBePaidPsw,
          },
          executionNote,
        },
      });

      return {
        id: existing.id,
        actionType,
        touchedParcelIds: [primaryParcel.id],
        voidedPayments: 0,
        consignmentItemsUnlinked: 0,
      };
    }

    if (existing.caseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY) {
      if (!linkedParcel) throw BadRequest('Duplicate case missing linked parcel');
      targetParcels.push(linkedParcel);
    } else {
      targetParcels.push(primaryParcel);
    }

    let totalVoidedPayments = 0;
    let totalConsignmentUnlinked = 0;
    const executionReason = `Reconciliation case ${existing.id}: type ${existing.caseType}${isNonEmptyText(input.executionNote) ? ` (${input.executionNote.trim()})` : ''}`;
    const touchedParcelIds: string[] = [];

    for (const targetParcel of targetParcels) {
      if (targetParcel.isDeleted) continue;
      if (!isParcelEligibleForReconciliation(targetParcel.status)) {
        throw BadRequest(`Parcel ${targetParcel.trackingCode} is already delivered`);
      }

      const allPayments = await listAllPaymentsForParcelRepo(targetParcel.id, tx);
      const activePaymentIds = allPayments.filter((row) => !row.voidedAt).map((row) => row.id);
      const voidedNow = await softVoidPaymentsByIdsRepo(
        activePaymentIds,
        input.actorUserId,
        executionReason,
        tx,
      );
      totalVoidedPayments += voidedNow;

      const unlinked = await removeActiveConsignmentItemsByParcelRepo(targetParcel.id, new Date());
      totalConsignmentUnlinked += unlinked;

      await updateParcelRepo(
        targetParcel.id,
        {
          status: ParcelStatus.CANCELLED,
          isDeleted: true,
          deletedBy: input.actorUserId,
          deletedAt: new Date(),
          deleteReason: executionReason,
        },
        tx,
      );
      touchedParcelIds.push(targetParcel.id);
    }

    await updateParcelReconciliationCaseRepo(
      existing.id,
      {
        status: ParcelReconciliationCaseStatus.EXECUTED,
        executedBy: input.actorUserId,
        executedAt: new Date(),
        voidedPaymentCount: totalVoidedPayments,
        resolutionNote: isNonEmptyText(input.executionNote)
          ? input.executionNote.trim()
          : existing.resolutionNote,
        metadata: {
          ...(existing.metadata as Record<string, unknown> | null),
          execution: {
            actionType,
            touchedParcelIds,
            consignmentItemsUnlinked: totalConsignmentUnlinked,
            voidedPayments: totalVoidedPayments,
          },
        },
      },
      tx,
    );

    await recordAuditLog({
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      entityType: 'parcel_reconciliation_case',
      entityId: existing.id,
      action: 'PARCEL_RECONCILIATION_CASE_EXECUTED',
      message: 'Parcel reconciliation case executed',
      metadata: {
        caseType: existing.caseType,
        actionType,
        touchedParcelIds,
        consignmentItemsUnlinked: totalConsignmentUnlinked,
        voidedPayments: totalVoidedPayments,
        executionNote: input.executionNote?.trim() || null,
      },
    });

    return {
      id: existing.id,
      actionType,
      touchedParcelIds,
      voidedPayments: totalVoidedPayments,
      consignmentItemsUnlinked: totalConsignmentUnlinked,
    };
  });
}
