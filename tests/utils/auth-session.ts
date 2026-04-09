import { createHash } from 'node:crypto';
import { createId } from '@paralleldrive/cuid2';
import { db } from '@/db/client';
import { refreshTokens } from '@/db/schemas';
import { signAccessToken } from '@/server/utils/jwt';

type CreateTestAccessTokenInput = {
  userId: string;
  email: string;
  permissions: string[];
  employeeId?: string | null;
  roleId?: string | null;
  companyId?: string | null;
  branchId?: string | null;
  branchType?: number | null;
  locationId?: string | null;
  userType?: number | null;
  cashierType?: number | null;
};

export async function createTestAccessToken(input: CreateTestAccessTokenInput) {
  const sid = createId();

  await db.insert(refreshTokens).values({
    id: sid,
    userId: input.userId,
    tokenHash: createHash('sha256').update(`${sid}:${Date.now()}:${input.userId}`).digest('hex'),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    permissionsSnapshot: input.permissions,
    userAgent: 'bun-test',
    ip: '127.0.0.1',
  });

  return signAccessToken({
    sub: input.userId,
    sid,
    email: input.email,
    employeeId: input.employeeId ?? null,
    roleId: input.roleId ?? null,
    companyId: input.companyId ?? null,
    branchId: input.branchId ?? null,
    branchType: input.branchType ?? null,
    locationId: input.locationId ?? null,
    userType: input.userType ?? null,
    cashierType: input.cashierType ?? null,
  });
}
