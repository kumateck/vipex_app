import { CashierType, UserStatus } from '@/db/schemas/enums';
import { Forbidden, NotFound } from '@/server/utils/http-error';
import { recordAuditLog } from '../audit/logger';
import { findActiveSessionRepo, getSessionRepo } from './repository';
import {
  assignSessionDelegateRepo,
  findActiveDelegatedSessionRepo,
  getCashierDelegateScopeRepo,
  listEligibleSessionDelegatesRepo,
  listSessionDelegatesRepo,
  revokeSessionDelegateRepo,
} from './delegates.repository';

type Owner = {
  sub: string;
  companyId?: string | null;
  branchId?: string | null;
  cashierType?: number | null;
};

async function getOwnedActiveSession(owner: Owner, sessionId: string) {
  const scope = await getCashierDelegateScopeRepo(owner.sub);
  if (scope?.cashierType !== CashierType.SENDING && scope?.cashierType !== CashierType.FULL) {
    throw Forbidden('Only sender or full cashiers can manage completion delegates');
  }
  const session = await getSessionRepo(sessionId);
  if (
    !session ||
    session.cashierId !== owner.sub ||
    session.branchId !== scope.branchId ||
    scope.branchId !== owner.branchId ||
    scope.companyId !== owner.companyId ||
    scope.status !== UserStatus.ACTIVE
  ) {
    throw NotFound('Cashier session not found');
  }
  if (session.status !== 'ACTIVE') throw Forbidden('Cashier session is no longer active');
  return scope;
}

export async function listSessionDelegateOptionsSvc(owner: Owner, sessionId: string) {
  const scope = await getOwnedActiveSession(owner, sessionId);
  const [eligible, assigned] = await Promise.all([
    listEligibleSessionDelegatesRepo(scope.companyId, scope.branchId, scope.locationId),
    listSessionDelegatesRepo(sessionId, scope.companyId, scope.branchId, scope.locationId),
  ]);
  return { eligible: eligible.filter((user) => user.id !== owner.sub), assigned };
}

export async function assignSessionDelegateSvc(owner: Owner, sessionId: string, userId: string) {
  const scope = await getOwnedActiveSession(owner, sessionId);
  const eligible = await listEligibleSessionDelegatesRepo(
    scope.companyId,
    scope.branchId,
    scope.locationId,
  );
  if (userId === owner.sub || !eligible.some((user) => user.id === userId)) {
    throw Forbidden(
      'User must be active, in this branch and location, and allowed to create parcels',
    );
  }
  const current = await findActiveDelegatedSessionRepo(userId, scope.companyId, scope.branchId);
  if (current && current.sessionId !== sessionId) {
    throw Forbidden('User is already assigned to another active cashier session');
  }
  await assignSessionDelegateRepo(sessionId, userId, owner.sub);
  await recordAuditLog({
    companyId: owner.companyId ?? null,
    actorUserId: owner.sub,
    entityType: 'cashier_session',
    entityId: sessionId,
    action: 'DELEGATE_ASSIGNED',
    message: 'To-be-paid completion delegate assigned',
    metadata: { userId },
  });
  return { sessionId, userId };
}

export async function revokeSessionDelegateSvc(owner: Owner, sessionId: string, userId: string) {
  await getOwnedActiveSession(owner, sessionId);
  if (!(await revokeSessionDelegateRepo(sessionId, userId)))
    throw NotFound('Active delegate not found');
  await recordAuditLog({
    companyId: owner.companyId ?? null,
    actorUserId: owner.sub,
    entityType: 'cashier_session',
    entityId: sessionId,
    action: 'DELEGATE_REVOKED',
    message: 'To-be-paid completion delegate removed',
    metadata: { userId },
  });
  return { sessionId, userId };
}

export async function resolveToBePaidCompletionSessionSvc(input: {
  userId: string;
  companyId: string;
  branchId: string;
}) {
  const scope = await getCashierDelegateScopeRepo(input.userId);
  if (
    !scope ||
    scope.companyId !== input.companyId ||
    scope.branchId !== input.branchId ||
    scope.status !== UserStatus.ACTIVE
  ) {
    throw Forbidden('No active cashier session authorizes you to complete to-be-paid parcels');
  }
  if (scope.cashierType === CashierType.SENDING || scope.cashierType === CashierType.FULL) {
    const own = await findActiveSessionRepo({ cashierId: input.userId, branchId: input.branchId });
    if (own) return { sessionId: own.id, cashierId: input.userId };
  }
  const delegated = await findActiveDelegatedSessionRepo(
    input.userId,
    input.companyId,
    input.branchId,
  );
  if (!delegated)
    throw Forbidden('No active cashier session authorizes you to complete to-be-paid parcels');
  return delegated;
}
