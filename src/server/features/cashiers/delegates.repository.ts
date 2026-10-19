import { and, asc, eq, isNull, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import { cashierSessionDelegates, cashierSessions, rolePermissions, users } from '@/db/schemas';
import { CashierType, UserStatus } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';

export async function getCashierDelegateScopeRepo(userId: string) {
  const [row] = await db
    .select({
      companyId: users.companyId,
      branchId: users.branchId,
      locationId: users.locationId,
      status: users.status,
      cashierType: users.cashierType,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}

export async function listEligibleSessionDelegatesRepo(
  companyId: string,
  branchId: string,
  locationId: string | null,
) {
  return db
    .selectDistinct({ id: users.id, fullname: users.fullname, email: users.email })
    .from(users)
    .innerJoin(
      rolePermissions,
      and(
        eq(rolePermissions.roleId, users.roleId),
        eq(rolePermissions.companyId, users.companyId),
        eq(rolePermissions.permission, PermissionKeys.CanCreateBookingWithParcels),
      ),
    )
    .where(
      and(
        eq(users.companyId, companyId),
        eq(users.branchId, branchId),
        ...(locationId ? [eq(users.locationId, locationId)] : []),
        eq(users.status, UserStatus.ACTIVE),
      ),
    )
    .orderBy(asc(users.fullname));
}

export async function listSessionDelegatesRepo(
  sessionId: string,
  companyId: string,
  branchId: string,
  locationId: string | null,
) {
  return db
    .select({
      userId: users.id,
      fullname: users.fullname,
      email: users.email,
      assignedAt: cashierSessionDelegates.assignedAt,
    })
    .from(cashierSessionDelegates)
    .innerJoin(users, eq(users.id, cashierSessionDelegates.userId))
    .where(
      and(
        eq(cashierSessionDelegates.sessionId, sessionId),
        isNull(cashierSessionDelegates.revokedAt),
        eq(users.companyId, companyId),
        eq(users.branchId, branchId),
        ...(locationId ? [eq(users.locationId, locationId)] : []),
      ),
    )
    .orderBy(asc(users.fullname));
}

export async function assignSessionDelegateRepo(
  sessionId: string,
  userId: string,
  assignedBy: string,
) {
  await db
    .insert(cashierSessionDelegates)
    .values({ sessionId, userId, assignedBy })
    .onConflictDoUpdate({
      target: [cashierSessionDelegates.sessionId, cashierSessionDelegates.userId],
      set: { revokedAt: null, assignedBy, assignedAt: new Date() },
    });
}

export async function revokeSessionDelegateRepo(sessionId: string, userId: string) {
  const [row] = await db
    .update(cashierSessionDelegates)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(cashierSessionDelegates.sessionId, sessionId),
        eq(cashierSessionDelegates.userId, userId),
        isNull(cashierSessionDelegates.revokedAt),
      ),
    )
    .returning({ id: cashierSessionDelegates.id });
  return Boolean(row);
}

export async function findActiveDelegatedSessionRepo(
  userId: string,
  companyId: string,
  branchId: string,
) {
  const delegate = alias(users, 'delegate_user');
  const [row] = await db
    .select({
      sessionId: cashierSessions.id,
      cashierId: cashierSessions.cashierId,
    })
    .from(cashierSessionDelegates)
    .innerJoin(cashierSessions, eq(cashierSessions.id, cashierSessionDelegates.sessionId))
    .innerJoin(users, eq(users.id, cashierSessions.cashierId))
    .innerJoin(delegate, eq(delegate.id, cashierSessionDelegates.userId))
    .innerJoin(
      rolePermissions,
      and(
        eq(rolePermissions.roleId, delegate.roleId),
        eq(rolePermissions.companyId, delegate.companyId),
        eq(rolePermissions.permission, PermissionKeys.CanCreateBookingWithParcels),
      ),
    )
    .where(
      and(
        eq(cashierSessionDelegates.userId, userId),
        isNull(cashierSessionDelegates.revokedAt),
        eq(cashierSessions.status, 'ACTIVE'),
        eq(cashierSessions.branchId, branchId),
        eq(users.companyId, companyId),
        eq(users.branchId, branchId),
        eq(users.status, UserStatus.ACTIVE),
        eq(delegate.companyId, companyId),
        eq(delegate.branchId, branchId),
        or(isNull(users.locationId), eq(delegate.locationId, users.locationId)),
        eq(delegate.status, UserStatus.ACTIVE),
        or(eq(users.cashierType, CashierType.SENDING), eq(users.cashierType, CashierType.FULL)),
      ),
    )
    .limit(1);
  return row ?? null;
}
