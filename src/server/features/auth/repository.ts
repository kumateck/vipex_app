import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../../db/config';
import { passwordResets, refreshTokens, users } from '@/db/schemas';

export async function getUserByEmailRepo(email: string) {
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return u ?? null;
}

export async function getUserByIdRepo(id: string) {
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return u ?? null;
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
