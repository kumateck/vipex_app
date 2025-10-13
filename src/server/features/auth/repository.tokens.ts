import { eq, and, gt } from 'drizzle-orm';
import { db } from '../../../db/config';
import { users } from '@/db/schemas';
import { UserStatus } from '@/db/schemas/enums';

// Store a hashed token and expiry on the user record
export async function setUserResetTokenRepo(input: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  await db
    .update(users)
    .set({
      resetToken: input.tokenHash,
      resetTokenExpires: input.expiresAt,
    })
    .where(eq(users.id, input.userId));
}

// Find a user by hashed token that hasn't expired
export async function findUserByResetTokenRepo(tokenHash: string) {
  const now = new Date();
  const [row] = await db
    .select()
    .from(users)
    .where(and(eq(users.resetToken, tokenHash), gt(users.resetTokenExpires, now)))
    .limit(1);
  return row ?? null;
}

// Clear token fields after use
export async function clearUserResetTokenRepo(userId: string) {
  await db
    .update(users)
    .set({ resetToken: null, resetTokenExpires: null })
    .where(eq(users.id, userId));
}

// Set password and (optionally) activate invited users
export async function setPasswordAndActivateUserRepo(input: {
  userId: string;
  passwordHash: string;
  setActiveIfInvited?: boolean; // default true
}) {
  const setActive = input.setActiveIfInvited ?? true;

  // If you want "activate-only-if-invited" logic but your Drizzle/PG helpers
  // don’t support CASE in SET, just set ACTIVE unconditionally or do a small
  // read-then-write. Here we set ACTIVE unconditionally (adjust if needed).
  await db
    .update(users)
    .set({
      password: input.passwordHash,
      status: setActive ? UserStatus.ACTIVE : undefined,
    } as typeof users.$inferInsert)
    .where(eq(users.id, input.userId));
}

// Minimal read for resend flow
export async function getUserInviteStateRepo(userId: string) {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      status: users.status, // integer status
      resetToken: users.resetToken,
      resetTokenExpires: users.resetTokenExpires,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return row ?? null;
}
