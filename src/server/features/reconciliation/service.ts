import { Conflict, NotFound } from '@/server/utils/http-error';
import { recordAuditLog } from '../audit/logger';
import {
  confirmDailyCashConfirmationSvc,
  createDailyCashConfirmationSvc,
  postDailyCashConfirmationSvc,
} from '../accounting/service';
import { ReconciliationSettlementStatus, reconciliationBankSettlements } from '@/db/schemas';
import {
  createBankSettlementRepo,
  findBankSettlementByNoRepo,
  getBankSettlementByIdRepo,
  listBankSettlementsRepo,
  listBranchOptionsForReconciliationRepo,
  listReconciliationSessionsRepo,
  updateBankSettlementStatusRepo,
  type ListBankSettlementsParams,
  type ListReconciliationSessionsParams,
} from './repository';

function buildSettlementNo() {
  return `RST-${Date.now().toString(36).toUpperCase()}`;
}

export async function listReconciliationSessionsSvc(params: ListReconciliationSessionsParams) {
  return listReconciliationSessionsRepo(params);
}

export async function createReconciliationSessionSvc(input: {
  companyId: string;
  createdBy: string;
  branchId: string;
  confirmationDate: string;
  expectedCashCedis: number | string;
  countedCashCedis: number | string;
  notes?: string | null;
  cashierUserId?: string | null;
}) {
  const created = await createDailyCashConfirmationSvc({
    companyId: input.companyId,
    branchId: input.branchId,
    confirmationDate: input.confirmationDate,
    expectedCashCedis: input.expectedCashCedis,
    countedCashCedis: input.countedCashCedis,
    createdBy: input.createdBy,
    cashierUserId: input.cashierUserId ?? null,
    notes: input.notes ?? null,
  });

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy,
    entityType: 'reconciliation_session',
    entityId: created.id,
    action: 'RECONCILIATION_SESSION_CREATED',
    message: 'Reconciliation session created',
  });

  return created;
}

export async function approveReconciliationSessionSvc(input: {
  id: string;
  approverUserId: string;
  companyId: string;
}) {
  const updated = await confirmDailyCashConfirmationSvc({
    id: input.id,
    accountantUserId: input.approverUserId,
  });

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.approverUserId,
    entityType: 'reconciliation_session',
    entityId: input.id,
    action: 'RECONCILIATION_SESSION_APPROVED',
    message: 'Reconciliation session approved',
  });

  return updated;
}

export async function finalizeReconciliationSessionSvc(input: {
  id: string;
  approverUserId: string;
  companyId: string;
}) {
  const updated = await postDailyCashConfirmationSvc({
    id: input.id,
    postedBy: input.approverUserId,
  });

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.approverUserId,
    entityType: 'reconciliation_session',
    entityId: input.id,
    action: 'RECONCILIATION_SESSION_FINALIZED',
    message: 'Reconciliation session finalized',
  });

  return updated;
}

export async function listBankSettlementsSvc(params: ListBankSettlementsParams) {
  return listBankSettlementsRepo(params);
}

export async function createBankSettlementSvc(input: {
  companyId: string;
  submittedByUserId: string;
  branchId: string;
  settlementDate: string;
  settlementNo?: string | null;
  bankReference?: string | null;
  expectedAmountPsw: number;
  bankedAmountPsw: number;
  notes?: string | null;
}) {
  const settlementNo = input.settlementNo?.trim() || buildSettlementNo();
  const exists = await findBankSettlementByNoRepo(input.companyId, settlementNo);
  if (exists) throw Conflict('Settlement number already exists');

  const variancePsw = input.bankedAmountPsw - input.expectedAmountPsw;
  const created = await createBankSettlementRepo({
    companyId: input.companyId,
    branchId: input.branchId,
    settlementNo,
    settlementDate: new Date(input.settlementDate),
    bankReference: input.bankReference ?? null,
    expectedAmountPsw: input.expectedAmountPsw,
    bankedAmountPsw: input.bankedAmountPsw,
    variancePsw,
    notes: input.notes ?? null,
    status: ReconciliationSettlementStatus.PENDING,
    submittedByUserId: input.submittedByUserId,
  });
  if (!created) throw Conflict('Failed to create bank settlement');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.submittedByUserId,
    entityType: 'reconciliation_bank_settlement',
    entityId: created.id,
    action: 'RECONCILIATION_BANK_SETTLEMENT_CREATED',
    message: `Bank settlement created: ${settlementNo}`,
    metadata: {
      expectedAmountPsw: input.expectedAmountPsw,
      bankedAmountPsw: input.bankedAmountPsw,
    },
  });

  return created;
}

export async function approveBankSettlementSvc(input: {
  id: string;
  companyId: string;
  approverUserId: string;
}) {
  const existing = await getBankSettlementByIdRepo(input.id, input.companyId);
  if (!existing) throw NotFound('Bank settlement not found');
  if (existing.status !== ReconciliationSettlementStatus.PENDING) {
    throw Conflict('Only pending bank settlements can be approved');
  }

  const updated = await updateBankSettlementStatusRepo(input.id, input.companyId, {
    status: ReconciliationSettlementStatus.APPROVED,
    approvedByUserId: input.approverUserId,
    approvedAt: new Date(),
    rejectedByUserId: null,
    rejectedAt: null,
    rejectionReason: null,
  } satisfies Partial<typeof reconciliationBankSettlements.$inferInsert>);

  if (!updated) throw NotFound('Bank settlement not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.approverUserId,
    entityType: 'reconciliation_bank_settlement',
    entityId: input.id,
    action: 'RECONCILIATION_BANK_SETTLEMENT_APPROVED',
    message: `Bank settlement approved: ${existing.settlementNo}`,
  });

  return updated;
}

export async function rejectBankSettlementSvc(input: {
  id: string;
  companyId: string;
  approverUserId: string;
  rejectionReason: string;
}) {
  const existing = await getBankSettlementByIdRepo(input.id, input.companyId);
  if (!existing) throw NotFound('Bank settlement not found');
  if (existing.status !== ReconciliationSettlementStatus.PENDING) {
    throw Conflict('Only pending bank settlements can be rejected');
  }

  const updated = await updateBankSettlementStatusRepo(input.id, input.companyId, {
    status: ReconciliationSettlementStatus.REJECTED,
    rejectedByUserId: input.approverUserId,
    rejectedAt: new Date(),
    rejectionReason: input.rejectionReason,
    approvedByUserId: null,
    approvedAt: null,
  } satisfies Partial<typeof reconciliationBankSettlements.$inferInsert>);

  if (!updated) throw NotFound('Bank settlement not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.approverUserId,
    entityType: 'reconciliation_bank_settlement',
    entityId: input.id,
    action: 'RECONCILIATION_BANK_SETTLEMENT_REJECTED',
    message: `Bank settlement rejected: ${existing.settlementNo}`,
    metadata: { rejectionReason: input.rejectionReason },
  });

  return updated;
}

export async function listReconciliationBranchOptionsSvc(companyId: string) {
  return listBranchOptionsForReconciliationRepo(companyId);
}
