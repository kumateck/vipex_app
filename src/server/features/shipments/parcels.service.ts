import { fromPesewas, toPesewas } from '@/server/utils/gh-money';
import {
  ParcelHolderType,
  ParcelDispositionActionType,
  ParcelReconciliationActionType,
  ParcelReconciliationCaseStatus,
  ParcelReconciliationCaseType,
  ParcelStatus,
  PaymentComponent,
} from '@/db/schemas';
import { JournalSourceType } from '@/db/schemas/enums';
import { auditLogs } from '@/db/schemas/audit';
import { db } from '@/db/config';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { BadRequest, Conflict, NotFound } from '../../utils/http-error';
import {
  DEFAULT_PARCEL_AGEING_POLICY,
  getParcelAgeingPolicyFromModuleSettings,
  type ParcelAgeingPolicy,
} from '@/shared/shipments/parcel-ageing-policy';
import {
  listAllPaymentsForParcelRepo,
  listPaymentsForParcelRepo,
  softVoidPaymentsByIdsRepo,
} from '../payments/repository';
import { getDeliveryByParcelRepo } from '../deliveries/repository';
import { getBranchRepo } from '../branches/repository';
import { recordAuditLog } from '../audit/logger';
import { listConsignmentsForParcelRepo } from './consignments.repository';
import { removeActiveConsignmentItemsByParcelRepo } from './consignments.repository';
import { getPickupQueueByParcelRepo, updatePickupQueueRepo } from '../pickup-queues/repository';
import { endPickupQueueForParcelSvc } from '../pickup-queues/service';
import {
  getParcelInternalHolderByParcelRepo,
  getWarehouseForTransferRepo,
  upsertParcelInternalHolderRepo,
} from '../parcel-internal-transfers/repository';
import { findCompanyModuleRepo } from '../company-modules/repository';
import { postJournalEntrySvc } from '../accounting/posting.service';
import { getAccountByCodeRepo } from '../accounting/repository';
import { isAccountingEnabledForCompanySvc } from '../accounting/service';
import {
  assertReceiverOtpVerifiedSvc,
  consumeReceiverOtpTokenSvc,
} from '../parcel-receiver-otp/service';
import {
  createParcelDiscrepancyRepo,
  getOpenDiscrepancyByParcelRepo,
  listOpenParcelDiscrepanciesRepo,
  resolveParcelDiscrepancyRepo,
} from './parcel-discrepancies.repository';
import { createParcelStickerPrintRepo } from './parcel-sticker-prints.repository';
import {
  createParcelReconciliationCaseRepo,
  getOpenParcelReconciliationCaseByParcelRepo,
  getParcelReconciliationCaseRepo,
  listEligibleParcelCorrectionSessionsRepo,
  listParcelReconciliationCasesRepo,
  updateParcelReconciliationCaseRepo,
} from './parcel-reconciliation-cases.repository';

import {
  createParcelDispositionActionRepo,
  createParcelRepo,
  createParcelStorageWaiverRepo,
  getParcelRepo,
  listParcelDispositionActionsRepo,
  listParcelStorageWaiversRepo,
  listParcelsRepo,
  listStuckParcelsRepo,
  sumParcelStorageWaiversPswRepo,
  updateParcelStorageWaiverAccountingPostingRepo,
  updateParcelRepo,
  type ListParcelsParams,
  type ListStuckParcelsParams,
  type ParcelRow,
} from './parcels.repository';
import { assertParcelFullyPaid } from './parcel-payment-settlement';
import {
  assertNoOutstandingStorageForHandover,
  resolveAndValidateStorageWaiverAmountPsw,
  validateStorageWaiverReason,
} from './storage-accrual-guards';
import { getParcelChargeValidationError } from '@/shared/shipments/parcel-charge-policy';
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

function getAuditMetadataNote(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const candidate = (metadata as Record<string, unknown>).notes;
  return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : null;
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function assertCaseType(value: number): ParcelReconciliationCaseType {
  if (Object.values(ParcelReconciliationCaseType).includes(value)) {
    return value as ParcelReconciliationCaseType;
  }
  throw BadRequest('Unsupported reconciliation case type');
}

function assertActionType(value: number): ParcelReconciliationActionType {
  if (Object.values(ParcelReconciliationActionType).includes(value)) {
    return value as ParcelReconciliationActionType;
  }
  throw BadRequest('Unsupported reconciliation action type');
}

function isReversalAllowedParcelStatus(status: number) {
  return status !== ParcelStatus.DELIVERED_AT_HOME && status !== ParcelStatus.DELIVERED_BY_OFFICE;
}

function isAmountCorrectionCaseType(caseType: ParcelReconciliationCaseType) {
  return (
    caseType === ParcelReconciliationCaseType.WRONG_AMOUNT ||
    caseType === ParcelReconciliationCaseType.DATA_ENTRY_ERROR
  );
}

function isOriginalSessionAmountCorrection(actionType: number | null | undefined) {
  return actionType === ParcelReconciliationActionType.CORRECT_AMOUNT_IN_ORIGINAL_SESSION;
}

const STORAGE_DAY_MS = 24 * 60 * 60 * 1000;
const STORAGE_PAYMENT_NOTE_PREFIX = 'STORAGE_CHARGE';
const STORAGE_WAIVER_RECEIVABLE_ACCOUNT_CODE = '1300';
const STORAGE_WAIVER_EXPENSE_ACCOUNT_CODE = '5180';

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

async function getCompanyParcelAgeingPolicy(companyId: string): Promise<ParcelAgeingPolicy> {
  const shipmentsModule = await findCompanyModuleRepo(companyId, 'shipments');
  return shipmentsModule?.settings
    ? getParcelAgeingPolicyFromModuleSettings(shipmentsModule.settings)
    : DEFAULT_PARCEL_AGEING_POLICY;
}

function computeParcelAgeingSnapshot(input: {
  status: number;
  receivedAt: Date | null;
  policy: ParcelAgeingPolicy;
  now: Date;
}) {
  const isCollectionStatus =
    input.status === ParcelStatus.AWAITING_PICKUP ||
    input.status === ParcelStatus.HOME_DELIVERY_REQUESTED;

  if (!isCollectionStatus || !input.receivedAt) {
    return {
      isParcelAgeingEligible: false,
      isParcelAged: false,
      ageingDays: null,
      storageChargeStartAt: null,
      storageChargeDays: 0,
      storageChargePsw: 0,
      storageFeePerDayPsw: input.policy.storageFeePerDayPsw,
      storageChargeGraceDays: input.policy.gracePeriodDays,
      ageingThresholdMonths: input.policy.agedThresholdMonths,
    };
  }

  const ageDays = Math.max(
    0,
    Math.floor((input.now.getTime() - input.receivedAt.getTime()) / STORAGE_DAY_MS),
  );
  const storageChargeStartAt = new Date(
    input.receivedAt.getTime() + input.policy.gracePeriodDays * STORAGE_DAY_MS,
  );
  const chargeDays = Math.max(
    0,
    Math.floor((input.now.getTime() - storageChargeStartAt.getTime()) / STORAGE_DAY_MS),
  );
  const isAged =
    addMonths(input.receivedAt, input.policy.agedThresholdMonths).getTime() <= input.now.getTime();

  return {
    isParcelAgeingEligible: true,
    isParcelAged: isAged,
    ageingDays: ageDays,
    storageChargeStartAt: storageChargeStartAt.toISOString(),
    storageChargeDays: chargeDays,
    storageChargePsw: chargeDays * input.policy.storageFeePerDayPsw,
    storageFeePerDayPsw: input.policy.storageFeePerDayPsw,
    storageChargeGraceDays: input.policy.gracePeriodDays,
    ageingThresholdMonths: input.policy.agedThresholdMonths,
  };
}

export function computeStorageAccrualPsw(input: {
  status: number;
  receivedAt: Date | null;
  policy: ParcelAgeingPolicy;
  now: Date;
}) {
  const isCollectionStatus =
    input.status === ParcelStatus.AWAITING_PICKUP ||
    input.status === ParcelStatus.HOME_DELIVERY_REQUESTED ||
    input.status === ParcelStatus.AGED_IN_WAREHOUSE;
  if (!isCollectionStatus || !input.receivedAt) return 0;
  const storageChargeStartAt = new Date(
    input.receivedAt.getTime() + input.policy.gracePeriodDays * STORAGE_DAY_MS,
  );
  const chargeDays = Math.max(
    0,
    Math.floor((input.now.getTime() - storageChargeStartAt.getTime()) / STORAGE_DAY_MS),
  );
  return chargeDays * input.policy.storageFeePerDayPsw;
}

export async function getParcelStorageSettlementSvc(
  parcelId: string,
  executor: DbExecutor = db,
): Promise<{
  parcelId: string;
  accruedPsw: number;
  paidPsw: number;
  waivedPsw: number;
  outstandingPsw: number;
}> {
  const parcel = await getParcelSvc(parcelId, executor);
  const policy = await getCompanyParcelAgeingPolicy(parcel.companyId);
  const accruedPsw = computeStorageAccrualPsw({
    status: parcel.status,
    receivedAt: parcel.receivedAt,
    policy,
    now: new Date(),
  });

  const [payments, waivedPsw] = await Promise.all([
    listPaymentsForParcelRepo(parcelId, executor),
    sumParcelStorageWaiversPswRepo(parcelId, executor),
  ]);

  const paidPsw = payments
    .filter(
      (payment) =>
        payment.component === PaymentComponent.OTHER &&
        (payment.notes ?? '').startsWith(STORAGE_PAYMENT_NOTE_PREFIX),
    )
    .reduce((sum, payment) => sum + Number(payment.grossAmountPsw ?? 0), 0);

  const outstandingPsw = Math.max(accruedPsw - paidPsw - waivedPsw, 0);

  return {
    parcelId,
    accruedPsw,
    paidPsw,
    waivedPsw,
    outstandingPsw,
  };
}

export async function listParcelsSvc(p: ListParcelsParams) {
  const policy =
    p.companyId && (p.agedOnly || p.storageChargeAccruing)
      ? await getCompanyParcelAgeingPolicy(p.companyId)
      : DEFAULT_PARCEL_AGEING_POLICY;

  const { data, totalRecords } = await listParcelsRepo({
    ...p,
    ageThresholdMonths: p.ageThresholdMonths ?? policy.agedThresholdMonths,
    storageGraceDays: p.storageGraceDays ?? policy.gracePeriodDays,
  });

  const now = new Date();
  const companyIds = [...new Set(data.map((row) => row.companyId).filter(Boolean))];
  const policyByCompany = new Map<string, ParcelAgeingPolicy>();

  await Promise.all(
    companyIds.map(async (companyId) => {
      policyByCompany.set(companyId, await getCompanyParcelAgeingPolicy(companyId));
    }),
  );

  return {
    data: data.map((row) => {
      const rowPolicy = policyByCompany.get(row.companyId) ?? DEFAULT_PARCEL_AGEING_POLICY;
      return {
        ...row,
        ...computeParcelAgeingSnapshot({
          status: row.status,
          receivedAt: row.receivedAt,
          policy: rowPolicy,
          now,
        }),
      };
    }),
    totalRecords,
  };
}
export async function listStuckParcelsSvc(p: ListStuckParcelsParams) {
  return listStuckParcelsRepo(p);
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
  const chargeValidationError = getParcelChargeValidationError({
    chargeCedis: fromPesewas(chargePsw),
    plannedToBePaidCedis: fromPesewas(plannedToBePaidPsw),
  });
  if (chargeValidationError) throw BadRequest(chargeValidationError);
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
    destinationId?: string;
    sourceLocationId?: string | null;
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
    receiverOtpVerificationToken?: string;
    receiverOtpTarget?: 'main' | 'second';
  },
  actorUserId?: string | null,
): Promise<{ id: string }> {
  const cur = await getParcelRepo(id);
  if (!cur) throw NotFound('Parcel not found');
  let verifiedReceiverOtp: Awaited<ReturnType<typeof assertReceiverOtpVerifiedSvc>> | null = null;
  if (patch.status === ParcelStatus.DELIVERED_BY_OFFICE) {
    const destinationBranch = await getBranchRepo(cur.destinationId);
    if (!destinationBranch) throw NotFound('Destination branch not found');
    if (destinationBranch.requirePickupOtp) {
      if (!patch.receiverOtpVerificationToken || !patch.receiverOtpTarget) {
        throw BadRequest('Receiver OTP verification is required before office pickup');
      }
      verifiedReceiverOtp = await assertReceiverOtpVerifiedSvc({
        parcelId: id,
        targetReceiver: patch.receiverOtpTarget,
        verificationToken: patch.receiverOtpVerificationToken,
      });
    }
    await assertParcelFullyPaid(id);
    const storageSettlement = await getParcelStorageSettlementSvc(id);
    assertNoOutstandingStorageForHandover(storageSettlement.outstandingPsw);
  }
  const setPatch: Partial<typeof cur> & { parcelValuePsw?: number } = {};
  if (patch.status !== undefined) setPatch.status = patch.status;
  if (patch.destinationId !== undefined) setPatch.destinationId = patch.destinationId;
  if (patch.sourceLocationId !== undefined) setPatch.sourceLocationId = patch.sourceLocationId;
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
  if (patch.chargeCedis !== undefined) {
    if (patch.chargeCedis != null) {
      const chargeValidationError = getParcelChargeValidationError({
        chargeCedis: Number(patch.chargeCedis),
        plannedToBePaidCedis: fromPesewas(BigInt(cur.plannedToBePaidPsw)),
      });
      if (chargeValidationError) throw BadRequest(chargeValidationError);
    }
    setPatch.chargePsw = patch.chargeCedis != null ? Number(toPesewas(patch.chargeCedis)) : 0;
  }
  if (patch.pickupLocationId !== undefined) setPatch.pickupLocationId = patch.pickupLocationId;
  if (patch.method !== undefined) setPatch.method = patch.method;
  if (patch.taxReportConfirmation !== undefined)
    setPatch.taxReportConfirmation = patch.taxReportConfirmation;

  const updated = await updateParcelRepo(id, setPatch);
  if (!updated) throw NotFound('Parcel not found');

  await recordAuditLog({
    companyId: cur.companyId,
    actorUserId: actorUserId ?? null,
    entityType: 'parcel',
    entityId: id,
    action: 'PARCEL_UPDATED',
    message: `Parcel ${cur.trackingCode} updated`,
    metadata: {
      patch: {
        ...patch,
        receiverOtpVerificationToken: patch.receiverOtpVerificationToken ? '[REDACTED]' : undefined,
      },
      previous: {
        destinationId: cur.destinationId,
        pickupLocationId: cur.pickupLocationId,
        status: cur.status,
      },
    },
  });

  const shouldEndPickupQueue =
    cur.status === ParcelStatus.AWAITING_PICKUP &&
    patch.status !== undefined &&
    patch.status !== ParcelStatus.AWAITING_PICKUP;
  if (shouldEndPickupQueue) {
    await endPickupQueueForParcelSvc({ parcelId: id, endedBy: patch.confirmedBy ?? null });
  }
  if (verifiedReceiverOtp) {
    await consumeReceiverOtpTokenSvc(verifiedReceiverOtp.id);
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
  const validationError = getParcelChargeValidationError({
    chargeCedis: fromPesewas(BigInt(cur.chargePsw)),
    plannedToBePaidCedis: Number(plannedCedis),
  });
  if (validationError) throw BadRequest(validationError);
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

  if (!isReversalAllowedParcelStatus(parcel.status)) {
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
    const targetParcels: ParcelRow[] = [];

    if (isOriginalSessionAmountCorrection(actionType)) {
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
      if (!isReversalAllowedParcelStatus(targetParcel.status)) {
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

export async function listParcelReconciliationCasesSvc(input: {
  companyId: string;
  statuses?: number[] | null;
  branchId?: string | null;
  limit: number;
  offset: number;
  search?: string | null;
}) {
  return listParcelReconciliationCasesRepo(input);
}

export async function getParcelFullDetailsSvc(id: string) {
  const parcel = await getParcelSvc(id);
  const [
    payments,
    delivery,
    consignments,
    pickupQueue,
    internalHolder,
    dispositionActions,
    storageWaivers,
    storageSettlement,
  ] = await Promise.all([
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
    (async () => {
      try {
        return await listParcelDispositionActionsRepo(id);
      } catch (error) {
        if (isSchemaCompatibilityError(error)) return [];
        throw error;
      }
    })(),
    (async () => {
      try {
        return await listParcelStorageWaiversRepo(id);
      } catch (error) {
        if (isSchemaCompatibilityError(error)) return [];
        throw error;
      }
    })(),
    (async () => {
      try {
        return await getParcelStorageSettlementSvc(id);
      } catch (error) {
        if (isSchemaCompatibilityError(error)) {
          return { parcelId: id, accruedPsw: 0, paidPsw: 0, waivedPsw: 0, outstandingPsw: 0 };
        }
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
    dispositionActions,
    storageWaivers,
    storageSettlement,
  };
}

export async function listParcelDispositionActionsSvc(parcelId: string) {
  await getParcelSvc(parcelId);
  return listParcelDispositionActionsRepo(parcelId);
}

export async function waiveParcelStorageAccrualSvc(input: {
  parcelId: string;
  actorUserId: string;
  reason: string;
  waivedAmountCedis?: number | string | null;
}) {
  const parcel = await getParcelSvc(input.parcelId);
  const reason = validateStorageWaiverReason(input.reason);

  const before = await getParcelStorageSettlementSvc(input.parcelId);

  const requestedPswRaw =
    input.waivedAmountCedis != null
      ? Number(toPesewas(input.waivedAmountCedis))
      : before.outstandingPsw;
  const requestedPsw = resolveAndValidateStorageWaiverAmountPsw({
    outstandingPsw: before.outstandingPsw,
    requestedPsw: requestedPswRaw,
  });

  const posting = await db.transaction(async (tx) => {
    const createdWaiver = await createParcelStorageWaiverRepo(
      {
        companyId: parcel.companyId,
        parcelId: input.parcelId,
        waivedAmountPsw: requestedPsw,
        reason,
        waivedBy: input.actorUserId,
        waivedAt: new Date(),
      },
      tx,
    );
    if (!createdWaiver) throw NotFound('Failed to record parcel storage waiver');

    if (!(await isAccountingEnabledForCompanySvc(parcel.companyId, tx))) {
      return null;
    }

    const [receivableAccount, expenseAccount] = await Promise.all([
      getAccountByCodeRepo(parcel.companyId, STORAGE_WAIVER_RECEIVABLE_ACCOUNT_CODE, tx),
      getAccountByCodeRepo(parcel.companyId, STORAGE_WAIVER_EXPENSE_ACCOUNT_CODE, tx),
    ]);

    if (!receivableAccount || !receivableAccount.active) {
      throw Conflict(
        `Accounting account ${STORAGE_WAIVER_RECEIVABLE_ACCOUNT_CODE} is required and must be active to post storage waivers`,
      );
    }
    if (!expenseAccount || !expenseAccount.active) {
      throw Conflict(
        `Accounting account ${STORAGE_WAIVER_EXPENSE_ACCOUNT_CODE} is required and must be active to post storage waivers`,
      );
    }

    const posted = await postJournalEntrySvc(
      {
        companyId: parcel.companyId,
        sourceType: JournalSourceType.PAYMENT,
        sourceId: createdWaiver.id,
        description: `Parcel storage waiver: ${parcel.trackingCode}`,
        memo: reason,
        branchId: parcel.destinationId,
        locationId: parcel.pickupLocationId ?? null,
        recordedByUserId: input.actorUserId,
        approvedByUserId: input.actorUserId,
        postedBy: input.actorUserId,
        lines: [
          {
            accountId: expenseAccount.id,
            debitPsw: requestedPsw,
            description: `Storage waiver expense for ${parcel.trackingCode}`,
            metadata: { parcelId: input.parcelId, waiverId: createdWaiver.id },
          },
          {
            accountId: receivableAccount.id,
            creditPsw: requestedPsw,
            description: `Storage receivable write-off for ${parcel.trackingCode}`,
            metadata: { parcelId: input.parcelId, waiverId: createdWaiver.id },
          },
        ],
      },
      tx,
    );

    const postedAt = new Date();
    await updateParcelStorageWaiverAccountingPostingRepo(
      createdWaiver.id,
      {
        accountingJournalEntryId: posted.entryId,
        accountingPostedAt: postedAt,
      },
      tx,
    );

    return { journalEntryId: posted.entryId, postedAt };
  });

  const after = await getParcelStorageSettlementSvc(input.parcelId);

  await recordAuditLog({
    companyId: parcel.companyId,
    actorUserId: input.actorUserId,
    entityType: 'parcel',
    entityId: input.parcelId,
    action: 'PARCEL_STORAGE_WAIVED',
    message: `Parcel storage accrual waived for ${parcel.trackingCode}`,
    metadata: {
      waivedAmountPsw: requestedPsw,
      reason,
      beforeOutstandingPsw: before.outstandingPsw,
      afterOutstandingPsw: after.outstandingPsw,
      accountingPosting: posting,
    },
  });

  return { id: input.parcelId };
}

export async function recordParcelDispositionActionSvc(input: {
  parcelId: string;
  actorUserId: string;
  actionType: number;
  notes?: string | null;
  warehouseId?: string | null;
  recoveredAmountCedis?: number | string | null;
}) {
  const parcel = await getParcelSvc(input.parcelId);
  const normalizedNotes = input.notes?.trim() || null;
  const recoveredAmountPsw =
    input.recoveredAmountCedis != null ? Number(toPesewas(input.recoveredAmountCedis)) : 0;

  const actionType = Number(input.actionType);
  if (!Object.values(ParcelDispositionActionType).includes(actionType)) {
    throw BadRequest('Unsupported parcel disposition action');
  }

  if (
    (actionType === ParcelDispositionActionType.SOLD ||
      actionType === ParcelDispositionActionType.DESTROYED ||
      actionType === ParcelDispositionActionType.DONATED) &&
    !normalizedNotes
  ) {
    throw BadRequest('Notes are required for final disposition actions');
  }

  let nextStatus: number | null = null;
  if (actionType === ParcelDispositionActionType.TRANSFERRED_TO_WAREHOUSE) {
    nextStatus = ParcelStatus.AGED_IN_WAREHOUSE;
    if (!input.warehouseId) throw BadRequest('Warehouse is required for warehouse transfer');
    const warehouse = await getWarehouseForTransferRepo(input.warehouseId);
    if (!warehouse || warehouse.isDeleted) throw NotFound('Selected warehouse not found');
    if (!warehouse.active) throw Conflict('Selected warehouse is inactive');
    if (warehouse.companyId !== parcel.companyId || warehouse.branchId !== parcel.destinationId) {
      throw Conflict('Selected warehouse must belong to parcel destination branch');
    }
  } else if (actionType === ParcelDispositionActionType.SOLD) {
    nextStatus = ParcelStatus.DISPOSED_BY_SALE;
  } else if (actionType === ParcelDispositionActionType.DESTROYED) {
    nextStatus = ParcelStatus.DISPOSED_BY_DESTRUCTION;
  } else if (actionType === ParcelDispositionActionType.DONATED) {
    nextStatus = ParcelStatus.DISPOSED_BY_DONATION;
  }

  const performedAt = new Date();

  await db.transaction(async (tx) => {
    await createParcelDispositionActionRepo(
      {
        companyId: parcel.companyId,
        parcelId: input.parcelId,
        actionType,
        warehouseId: input.warehouseId ?? null,
        notes: normalizedNotes,
        recoveredAmountPsw,
        performedBy: input.actorUserId,
        performedAt,
      },
      tx,
    );

    if (nextStatus != null && parcel.status !== nextStatus) {
      await updateParcelRepo(input.parcelId, { status: nextStatus }, tx);
    }

    if (actionType === ParcelDispositionActionType.TRANSFERRED_TO_WAREHOUSE && input.warehouseId) {
      await upsertParcelInternalHolderRepo(
        {
          parcelId: input.parcelId,
          companyId: parcel.companyId,
          branchId: parcel.destinationId,
          holderType: ParcelHolderType.WAREHOUSE,
          locationId: null,
          warehouseId: input.warehouseId,
          updatedBy: input.actorUserId,
        },
        tx,
      );
    }
  });

  await recordAuditLog({
    companyId: parcel.companyId,
    actorUserId: input.actorUserId,
    entityType: 'parcel',
    entityId: input.parcelId,
    action: 'PARCEL_DISPOSITION_ACTION_RECORDED',
    message: `Parcel disposition action recorded for ${parcel.trackingCode}`,
    metadata: {
      actionType,
      warehouseId: input.warehouseId ?? null,
      notes: normalizedNotes,
      recoveredAmountPsw,
      nextStatus,
    },
  });

  return { id: input.parcelId };
}

export async function logParcelStickerPrintSvc(input: {
  companyId: string;
  branchId?: string | null;
  printedBy?: string | null;
  bookingCode: string;
  trackingCode: string;
  copies?: number | null;
}) {
  const copies = Math.max(Math.trunc(input.copies ?? 1), 1);
  return createParcelStickerPrintRepo({
    companyId: input.companyId,
    branchId: input.branchId ?? null,
    bookingCode: input.bookingCode,
    trackingCode: input.trackingCode,
    copies,
    printedBy: input.printedBy ?? null,
  });
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

  if (input.discrepancyType === 'record_not_physical' && input.parcelId && parcel) {
    try {
      const open = await getOpenDiscrepancyByParcelRepo(input.parcelId);
      if (!open) {
        await createParcelDiscrepancyRepo({
          companyId: input.companyId,
          parcelId: input.parcelId,
          branchId: input.branchId ?? parcel.destinationId ?? null,
          trackingCode: input.trackingCode ?? parcel.trackingCode,
          bookingCode: input.bookingCode ?? parcel.bookingCode,
          discrepancyType: input.discrepancyType,
          notes: input.notes?.trim() || null,
          status: 0,
          createdBy: input.actorUserId ?? null,
        });
      }
    } catch (error) {
      if (!isSchemaCompatibilityError(error)) throw error;
    }

    if (parcel.status !== ParcelStatus.DISCREPANCY) {
      await updateParcelRepo(
        input.parcelId,
        {
          status: ParcelStatus.DISCREPANCY,
        },
        db,
      );
    }
  }

  if (input.discrepancyType === 'physical_missing_in_system') {
    try {
      await createParcelDiscrepancyRepo({
        companyId: input.companyId,
        parcelId: input.parcelId ?? null,
        branchId: input.branchId ?? null,
        trackingCode: input.trackingCode ?? null,
        bookingCode: input.bookingCode ?? null,
        discrepancyType: input.discrepancyType,
        notes: input.notes?.trim() || null,
        status: 0,
        createdBy: input.actorUserId ?? null,
      });
    } catch (error) {
      if (!isSchemaCompatibilityError(error)) throw error;
    }
  }

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

export async function listOpenParcelDiscrepanciesSvc(input: {
  companyId: string;
  branchId?: string | null;
  limit: number;
  offset: number;
  search?: string | null;
}) {
  try {
    return await listOpenParcelDiscrepanciesRepo(input);
  } catch (error) {
    if (!isSchemaCompatibilityError(error)) throw error;

    const { data, totalRecords } = await listParcelsRepo({
      limit: input.limit,
      offset: input.offset,
      companyId: input.companyId,
      destinationId: input.branchId ?? null,
      status: ParcelStatus.DISCREPANCY,
      statuses: null,
      sourceId: null,
      locationId: null,
      senderPaid: null,
      search: input.search ?? null,
      received: null,
      includeDeleted: false,
      sort: null,
    });

    const parcelIds = data.map((parcel) => parcel.id);
    const noteByParcelId = new Map<string, { note: string | null; createdAt: Date }>();

    if (parcelIds.length > 0) {
      const auditRows = await db
        .select({
          entityId: auditLogs.entityId,
          metadata: auditLogs.metadata,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.companyId, input.companyId),
            eq(auditLogs.action, 'PARCEL_DISCREPANCY_LOGGED'),
            eq(auditLogs.entityType, 'parcel_discrepancy'),
            inArray(auditLogs.entityId, parcelIds),
          ),
        )
        .orderBy(desc(auditLogs.createdAt));

      for (const row of auditRows) {
        if (!row.entityId || noteByParcelId.has(row.entityId)) continue;
        noteByParcelId.set(row.entityId, {
          note: getAuditMetadataNote(row.metadata),
          createdAt: row.createdAt,
        });
      }
    }

    return {
      data: data.map((parcel) => ({
        // Compatibility mode fallback when parcel_discrepancies table is not yet available.
        id: parcel.id,
        parcelId: parcel.id,
        branchId: parcel.destinationId,
        branchName: parcel.destinationName ?? null,
        trackingCode: parcel.trackingCode,
        bookingCode: parcel.bookingCode,
        discrepancyType: 'record_not_physical',
        notes: noteByParcelId.get(parcel.id)?.note ?? null,
        createdBy: parcel.createdBy,
        createdByName: null,
        createdAt: noteByParcelId.get(parcel.id)?.createdAt ?? parcel.updatedAt,
        parcelStatus: parcel.status,
        sourceId: parcel.sourceId,
        destinationId: parcel.destinationId,
        pickupLocationId: parcel.pickupLocationId,
        destinationLocationName: parcel.pickupLocationName ?? null,
        senderName: parcel.senderName,
        receiverName: parcel.receiverName,
      })),
      totalRecords,
    };
  }
}

export async function resolveParcelDiscrepancySvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  resolutionNote?: string | null;
}) {
  let resolved: {
    id: string;
    parcelId: string | null;
    companyId: string;
    trackingCode: string | null;
    bookingCode: string | null;
  } | null;

  try {
    resolved = await resolveParcelDiscrepancyRepo(input.id, input.companyId, {
      resolvedBy: input.actorUserId,
      resolvedAt: new Date(),
      resolutionNote: input.resolutionNote?.trim() || null,
    });
  } catch (error) {
    if (!isSchemaCompatibilityError(error)) throw error;

    const parcel = await getParcelRepo(input.id);
    if (!parcel || parcel.companyId !== input.companyId) {
      throw NotFound('Discrepancy parcel not found');
    }
    if (parcel.status !== ParcelStatus.DISCREPANCY) {
      throw BadRequest('Parcel is not in discrepancy status');
    }

    await updateParcelRepo(parcel.id, { status: ParcelStatus.IN_TRANSIT }, db);

    await recordAuditLog({
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      entityType: 'parcel_discrepancy',
      entityId: parcel.id,
      action: 'PARCEL_DISCREPANCY_RESOLVED',
      message: 'Parcel discrepancy resolved (compat mode)',
      metadata: {
        parcelId: parcel.id,
        trackingCode: parcel.trackingCode,
        bookingCode: parcel.bookingCode,
        resolutionNote: input.resolutionNote?.trim() || null,
        compatibilityMode: true,
      },
    });

    return { id: parcel.id, parcelId: parcel.id };
  }

  if (!resolved) throw NotFound('Open discrepancy not found');

  if (resolved.parcelId) {
    await updateParcelRepo(resolved.parcelId, { status: ParcelStatus.IN_TRANSIT }, db);
  }

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'parcel_discrepancy',
    entityId: resolved.id,
    action: 'PARCEL_DISCREPANCY_RESOLVED',
    message: 'Parcel discrepancy resolved',
    metadata: {
      parcelId: resolved.parcelId,
      trackingCode: resolved.trackingCode,
      bookingCode: resolved.bookingCode,
      resolutionNote: input.resolutionNote?.trim() || null,
    },
  });

  return { id: resolved.id, parcelId: resolved.parcelId };
}

export async function assignParcelToCallCenterSvc(input: { parcelId: string; userId: string }) {
  const parcel = await getParcelRepo(input.parcelId);
  if (!parcel) throw NotFound('Parcel not found');

  await updateParcelRepo(input.parcelId, { callCenterAssignedToUserId: input.userId }, db);

  return { success: true, parcelId: input.parcelId };
}

export async function bulkAssignParcelsToCallCenterSvc(input: {
  parcelIds: string[];
  userId: string;
}) {
  if (input.parcelIds.length === 0) throw BadRequest('Select at least one parcel');
  for (const parcelId of input.parcelIds) {
    await assignParcelToCallCenterSvc({ parcelId, userId: input.userId });
  }
  return { success: true, assignedCount: input.parcelIds.length };
}

export async function updateParcelShelfPickerSvc(input: { parcelId: string; userId: string }) {
  const parcel = await getParcelRepo(input.parcelId);
  if (!parcel) throw NotFound('Parcel not found');

  const queue = await getPickupQueueByParcelRepo(input.parcelId);
  await db.transaction(async (tx) => {
    await updateParcelRepo(input.parcelId, { shelfPickerStaffId: input.userId }, tx);
    if (queue) await updatePickupQueueRepo(queue.id, { pickerStaffId: input.userId }, tx);
  });

  return { success: true, parcelId: input.parcelId };
}
