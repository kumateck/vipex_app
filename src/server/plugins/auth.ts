import type { Elysia } from 'elysia';
import { BranchType } from '@/db/schemas/enums';
import { PermissionCatalog } from '@/shared/permissions/constants';
import { getUserByIdRepo, listRolePermissionKeysRepo } from '@/server/features/auth/repository';
import { verifyAccessToken } from '../utils/jwt';
import { Unauthorized as UnauthorizedError } from '../utils/http-error';
import { Forbidden } from '../utils/http-error';
import { ensureCompanyModuleEnabledSvc } from '../features/company-modules/service';

export type AuthUser = {
  sub: string;
  email: string;
  employeeId?: string | null;
  roleId?: string | null;
  companyId?: string | null;
  branchId?: string | null;
  branchType?: number | null;
  locationId?: string | null;
  userType?: number | null;
  cashierType?: number | null;
  permissions?: string[];
  iat?: number;
  exp?: number;
};

export const authPlugin = (app: Elysia) =>
  app.derive(async ({ request }) => {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) return { user: null as AuthUser | null };

    const token = auth.slice('Bearer '.length).trim();
    try {
      const payload = await verifyAccessToken(token);
      const userRecord = await getUserByIdRepo(payload.sub);
      if (!userRecord) return { user: null as AuthUser | null };

      const permissions =
        (await listRolePermissionKeysRepo(
          userRecord.roleId ?? null,
          userRecord.companyId ?? null,
        )) ?? [];
      const resolvedPermissions =
        permissions.length > 0
          ? permissions
          : PermissionCatalog.map((permission) => permission.key);
      return {
        user: {
          sub: userRecord.id,
          email: userRecord.email,
          employeeId: userRecord.employeeId ?? null,
          roleId: userRecord.roleId ?? null,
          companyId: userRecord.companyId ?? null,
          branchId: userRecord.branchId ?? null,
          branchType: userRecord.branch?.type ?? null,
          locationId: userRecord.locationId ?? null,
          userType: userRecord.userType ?? null,
          cashierType: userRecord.cashierType ?? null,
          permissions: resolvedPermissions,
          iat: payload.iat,
          exp: payload.exp,
        } satisfies AuthUser,
      };
    } catch {
      return { user: null as AuthUser | null };
    }
  });

// Use in route options: { beforeHandle: requireAuth() }
// Throwing avoids status typing conflicts in Elysia's route context
export function requireAuth() {
  return ({ user }: { user: AuthUser | null }) => {
    if (!user) throw UnauthorizedError();
  };
}

export function requirePermissions(...required: string[]) {
  return ({ user }: { user: AuthUser | null }) => {
    if (!user) throw UnauthorizedError();
    const granted = new Set(user.permissions ?? []);
    const ok = required.every((permission) => granted.has(permission));
    if (!ok) throw Forbidden();
  };
}

export function requireAnyPermissions(...required: string[]) {
  return ({ user }: { user: AuthUser | null }) => {
    if (!user) throw UnauthorizedError();
    const granted = new Set(user.permissions ?? []);
    const ok = required.some((permission) => granted.has(permission));
    if (!ok) throw Forbidden();
  };
}

export function requireHeadOffice(message = 'Only head office users can perform this action') {
  return ({ user }: { user: AuthUser | null }) => {
    if (!user) throw UnauthorizedError();
    if (user.branchType !== BranchType.HEADOFFICE) throw Forbidden(message);
  };
}

export function requireModuleEnabled(moduleCode: string) {
  return async ({ user }: { user: AuthUser | null }) => {
    if (!user) throw UnauthorizedError();
    if (!user.companyId) throw Forbidden('Authenticated user company context is missing');
    await ensureCompanyModuleEnabledSvc(user.companyId, moduleCode);
  };
}
