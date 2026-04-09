import type { Elysia } from 'elysia';
import { BranchType } from '@/db/schemas/enums';
import {
  findRefreshTokenByIdRepo,
  getUserByIdRepo,
  listRolePermissionKeysRepo,
} from '@/server/features/auth/repository';
import { env } from '../utils/env';
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
      if (!payload.sid || !payload.email) return { user: null as AuthUser | null };
      const refreshTokenRow = await findRefreshTokenByIdRepo(payload.sid);
      if (!refreshTokenRow) return { user: null as AuthUser | null };
      if (refreshTokenRow.revokedAt) return { user: null as AuthUser | null };
      if (refreshTokenRow.expiresAt.getTime() <= Date.now())
        return { user: null as AuthUser | null };
      return {
        user: {
          sub: payload.sub,
          email: payload.email,
          employeeId: payload.employeeId ?? null,
          roleId: payload.roleId ?? null,
          companyId: payload.companyId ?? null,
          branchId: payload.branchId ?? null,
          branchType: payload.branchType ?? null,
          locationId: payload.locationId ?? null,
          userType: payload.userType ?? null,
          cashierType: payload.cashierType ?? null,
          permissions: Array.isArray(refreshTokenRow.permissionsSnapshot)
            ? refreshTokenRow.permissionsSnapshot
            : [],
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
