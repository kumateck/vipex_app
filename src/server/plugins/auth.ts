import type { Elysia } from 'elysia';
import { verifyAccessToken } from '../utils/jwt';
import { Unauthorized as UnauthorizedError } from '../utils/http-error';

export type AuthUser = {
  sub: string;
  email: string;
  roleId?: string | null;
  companyId?: string | null;
  branchId?: string | null;
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
      return { user: payload as AuthUser };
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
