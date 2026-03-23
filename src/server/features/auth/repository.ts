import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../../../db/config';
import {
  branches,
  companies,
  locations,
  passwordResets,
  refreshTokens,
  rolePermissions,
  roles,
  users,
} from '@/db/schemas';

// export async function getUserByEmailRepo(email: string) {
//   const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
//   return u ?? null;
// }
export async function getUserByEmailRepo(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const [row] = await db
    .select({
      user: users,
      branch: { id: branches.id, name: branches.name, type: branches.type },
      location: { id: locations.id, name: locations.name },
      company: { id: companies.id, name: companies.name, useAccounting: companies.useAccounting },
      role: { id: roles.id, name: roles.name },
    })
    .from(users)
    .leftJoin(branches, eq(branches.id, users.branchId))
    .leftJoin(locations, eq(locations.id, users.locationId))
    .leftJoin(companies, eq(companies.id, users.companyId))
    .leftJoin(roles, eq(roles.id, users.roleId))
    .where(sql`lower(${users.email}) = ${normalizedEmail}`)
    .limit(1);

  if (!row) return null;

  return {
    ...row.user,
    branch: row.branch?.id ? row.branch : null,
    location: row.location?.id ? row.location : null,
    company: row.company?.id ? row.company : null,
    role: row.role?.id ? row.role : null,
  };
}

export async function listRolePermissionKeysRepo(
  roleId?: string | null,
  companyId?: string | null,
): Promise<string[]> {
  if (!roleId || !companyId) return [];
  const rows = await db
    .select({ key: rolePermissions.permission })
    .from(rolePermissions)
    .where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.companyId, companyId)));
  return rows.map((row) => row.key);
}

export async function getUserByIdRepo(id: string) {
  const [row] = await db
    .select({
      user: users,
      branch: { id: branches.id, name: branches.name, type: branches.type },
      location: { id: locations.id, name: locations.name },
      company: { id: companies.id, name: companies.name, useAccounting: companies.useAccounting },
      role: { id: roles.id, name: roles.name },
    })
    .from(users)
    .leftJoin(branches, eq(branches.id, users.branchId))
    .leftJoin(locations, eq(locations.id, users.locationId))
    .leftJoin(companies, eq(companies.id, users.companyId))
    .leftJoin(roles, eq(roles.id, users.roleId))
    .where(eq(users.id, id))
    .limit(1);

  if (!row) return null;

  return {
    ...row.user,
    branch: row.branch?.id ? row.branch : null,
    location: row.location?.id ? row.location : null,
    company: row.company?.id ? row.company : null,
    role: row.role?.id ? row.role : null,
  };
}

export async function insertRefreshTokenRepo(data: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string | null;
  ip?: string | null;
}) {
  await db.insert(refreshTokens).values({
    userId: data.userId,
    tokenHash: data.tokenHash,
    expiresAt: data.expiresAt,
    userAgent: data.userAgent || null,
    ip: data.ip || null,
  });
}

export async function findRefreshTokenRepo(tokenHash: string) {
  const [rt] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);
  return rt ?? null;
}

export async function rotateRefreshTokenRepo(
  prevHash: string,
  nextHash: string,
  nextExpires: Date,
) {
  // Mark previous as revoked and rotated, then insert new
  await db.transaction(async (tx) => {
    await tx
      .update(refreshTokens)
      .set({ revokedAt: new Date(), replacedByHash: nextHash })
      .where(eq(refreshTokens.tokenHash, prevHash));
    const prev = await tx
      .select({ userId: refreshTokens.userId })
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, prevHash))
      .limit(1);
    if (prev.length) {
      await tx.insert(refreshTokens).values({
        userId: prev[0]!.userId,
        tokenHash: nextHash,
        expiresAt: nextExpires,
      });
    }
  });
}

export async function revokeRefreshTokenRepo(tokenHash: string) {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function revokeAllUserTokensRepo(userId: string) {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
}

export async function insertPasswordResetRepo(data: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  await db.insert(passwordResets).values({
    userId: data.userId,
    tokenHash: data.tokenHash,
    expiresAt: data.expiresAt,
  });
}

export async function findPasswordResetRepo(tokenHash: string) {
  const [row] = await db
    .select()
    .from(passwordResets)
    .where(eq(passwordResets.tokenHash, tokenHash))
    .limit(1);
  return row ?? null;
}

export async function markPasswordResetUsedRepo(tokenHash: string) {
  await db
    .update(passwordResets)
    .set({ usedAt: new Date() })
    .where(eq(passwordResets.tokenHash, tokenHash));
}

export async function updateUserPasswordRepo(userId: string, passwordHash: string) {
  await db.update(users).set({ password: passwordHash }).where(eq(users.id, userId));
}
