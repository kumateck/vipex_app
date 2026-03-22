import { toPesewas } from '@/server/utils/gh-money';
import { BadRequest, Forbidden, NotFound } from '../../utils/http-error';
import { recordAuditLog } from '../audit/logger';

import {
  createSessionTypeRepo,
  getSessionRepo,
  listSessionTypesRepo,
  listSessionsRepo,
  openSessionRepo,
  closeSessionRepo,
  getSessionTypeRepo,
  findActiveSessionRepo,
  hasSameDayCompletedSessionRepo,
  getSessionAmountPaidPswRepo,
  getSessionToBePaidCollectedPswRepo,
  getSessionDeliveryFeeCollectedPswRepo,
  getSessionCreditCreatedPswRepo,
  type SessionRow,
  type ListSessionsParams,
} from './repository';
import { db } from '@/db/config';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export async function listSessionTypesSvc() {
  return listSessionTypesRepo();
}
export async function createSessionTypeSvc(input: {
  sessionType: string;
  startTime: string;
  endTime: string;
  createdBy: string;
}) {
  const created = await createSessionTypeRepo(input);
  return { id: created.id };
}

export async function listSessionsSvc(p: ListSessionsParams) {
  return listSessionsRepo(p);
}
export async function getSessionSvc(id: string): Promise<SessionRow> {
  const s = await getSessionRepo(id);
  if (!s) throw NotFound('Session not found');
  return s;
}
export async function openSessionSvc(input: {
  companyId?: string | null;
  actorUserId?: string | null;
  cashierId: string;
  branchId: string;
  sessionTypeId: string;
  startTime: string; // ISO
  openingBalanceCedis?: number | string | null;
  allowSameDayReopen?: boolean;
}) {
  if (!input.cashierId || !input.branchId) {
    throw BadRequest('Authenticated cashier and branch are required');
  }

  const startTime = new Date(input.startTime);
  if (Number.isNaN(startTime.getTime())) {
    throw BadRequest('Invalid start time');
  }

  const active = await findActiveSessionRepo({ cashierId: input.cashierId });
  if (active) {
    throw BadRequest('Cashier already has an active session. Close it before opening another.');
  }

  const hadCompletedToday = await hasSameDayCompletedSessionRepo({
    cashierId: input.cashierId,
    branchId: input.branchId,
    day: startTime,
  });
  if (hadCompletedToday && !input.allowSameDayReopen) {
    throw Forbidden('Only admin can reopen a cashier session on the same day');
  }

  const openingBalancePsw =
    input.openingBalanceCedis != null ? Number(toPesewas(input.openingBalanceCedis)) : 0;
  const scheduledStartTime = startTime;
  const scheduledEndTime = new Date(scheduledStartTime.getTime() + 8 * 60 * 60 * 1000);
  const sessionType = await getSessionTypeRepo(input.sessionTypeId);
  if (!sessionType) {
    throw BadRequest('Invalid session type');
  }

  const created = await openSessionRepo({
    cashierId: input.cashierId,
    branchId: input.branchId,
    // cashiers/session-types currently uses cashier_session_types table while
    // cashier_sessions_enhanced.shiftTypeId references shift_types.
    // Keep null until these models are unified.
    shiftTypeId: null,
    scheduledStartTime,
    scheduledEndTime,
    actualStartTime: scheduledStartTime,
    openingBalancePsw,
    status: 'ACTIVE',
  });
  await recordAuditLog({
    companyId: input.companyId ?? null,
    actorUserId: input.actorUserId ?? input.cashierId,
    entityType: 'cashier_session',
    entityId: created.id,
    action: 'CASHIER_SESSION_OPENED',
    message: 'Cashier session opened',
    metadata: {
      cashierId: input.cashierId,
      branchId: input.branchId,
      sessionTypeId: input.sessionTypeId,
      startTime: input.startTime,
      allowSameDayReopen: !!input.allowSameDayReopen,
    },
  });
  return { id: created.id };
}
export async function closeSessionSvc(
  id: string,
  input: {
    endTime: string;
    closingBalanceCedis?: number | string | null;
    companyId?: string | null;
    actorUserId?: string | null;
  },
) {
  const existing = await getSessionRepo(id);
  if (!existing) throw NotFound('Session not found');
  if (existing.status !== 'ACTIVE') {
    throw BadRequest('Only active sessions can be closed');
  }

  const patch = {
    actualEndTime: new Date(input.endTime),
    closingBalancePsw:
      input.closingBalanceCedis != null ? Number(toPesewas(input.closingBalanceCedis)) : 0,
    status: 'COMPLETED',
  };
  const updated = await closeSessionRepo(id, patch);
  if (!updated) throw NotFound('Session not found');
  await recordAuditLog({
    companyId: input.companyId ?? null,
    actorUserId: input.actorUserId ?? null,
    entityType: 'cashier_session',
    entityId: id,
    action: 'CASHIER_SESSION_CLOSED',
    message: 'Cashier session closed',
    metadata: {
      endTime: input.endTime,
      closingBalanceCedis: input.closingBalanceCedis ?? null,
    },
  });
  return { id: updated.id };
}

export async function getCurrentActiveSessionSvc(input: {
  cashierId: string;
  branchId?: string | null;
  executor?: DbExecutor;
}): Promise<SessionRow | null> {
  return findActiveSessionRepo(input);
}

export async function assertActiveSessionSvc(input: {
  cashierId: string;
  branchId?: string | null;
  executor?: DbExecutor;
}): Promise<SessionRow> {
  const session = await findActiveSessionRepo(input);
  if (!session) {
    throw Forbidden('An active cashier session is required to perform this action');
  }
  return session;
}

export async function getCurrentActiveSessionSummarySvc(input: {
  cashierId: string;
  branchId?: string | null;
  mode?: 'sender' | 'receiver' | 'delivery';
}) {
  const session = await findActiveSessionRepo(input);
  if (!session) {
    return null;
  }

  const [
    totalSenderSalesPsw,
    totalToBePaidCollectedPsw,
    totalDeliveryFeeCollectedPsw,
    totalCreditCreatedPsw,
  ] = await Promise.all([
    getSessionAmountPaidPswRepo({ sessionId: session.id, cashierId: input.cashierId }),
    getSessionToBePaidCollectedPswRepo({ sessionId: session.id, cashierId: input.cashierId }),
    getSessionDeliveryFeeCollectedPswRepo({ sessionId: session.id, cashierId: input.cashierId }),
    getSessionCreditCreatedPswRepo(session.id),
  ]);

  const mode = input.mode ?? 'sender';

  const amountPaidPsw =
    mode === 'receiver'
      ? totalToBePaidCollectedPsw
      : mode === 'delivery'
        ? totalDeliveryFeeCollectedPsw + totalToBePaidCollectedPsw
        : totalSenderSalesPsw;

  const totalSalesPsw =
    mode === 'receiver'
      ? totalToBePaidCollectedPsw
      : mode === 'delivery'
        ? totalDeliveryFeeCollectedPsw + totalToBePaidCollectedPsw
        : totalSenderSalesPsw;

  const toBePaidPsw = mode === 'sender' ? totalCreditCreatedPsw : totalToBePaidCollectedPsw;

  return {
    sessionId: session.id,
    amountPaidPsw,
    toBePaidPsw,
    totalSalesPsw,
    totalCreditCreatedPsw,
    totalToBePaidCollectedPsw,
    totalDeliveryFeeCollectedPsw,
    mode,
  };
}
