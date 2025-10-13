import { randomBytes } from 'node:crypto';
import { hashPassword, verifyPassword } from '../../utils/password';
import { signAccessToken } from '../../utils/jwt';
import {
  findPasswordResetRepo,
  findRefreshTokenRepo,
  getUserByEmailRepo,
  getUserByIdRepo,
  insertPasswordResetRepo,
  insertRefreshTokenRepo,
  markPasswordResetUsedRepo,
  revokeAllUserTokensRepo,
  revokeRefreshTokenRepo,
  rotateRefreshTokenRepo,
  updateUserPasswordRepo,
} from './repository';
import { env } from '../../utils/env';
import { parseDurationToSeconds } from '../../utils/duration';
import { sendPasswordResetEmail } from '@/server/services/mail/templates/password-reset';
import { UserStatus } from '@/db/schemas/enums';

// function sha256Hex(input: string): string {
//   // Bun supports SubtleCrypto
//   const enc = new TextEncoder().encode(input);
//   // Note: top-level await not allowed here; make a sync-like helper via deopt (not ideal)
//   // We’ll compute in async functions where needed.
//   throw new Error("Use sha256HexAsync instead");
// }

async function sha256HexAsync(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex'); // 64 hex chars
}

export async function loginSvc(email: string, password: string, ua?: string, ip?: string) {
  const user = await getUserByEmailRepo(email);
  if (!user) throw new Error('Invalid credentials');
  if (user.status && user.status !== UserStatus.ACTIVE) throw new Error('Account disabled');

  const ok = await verifyPassword(password, user?.password);
  if (!ok) throw new Error('Invalid credentials');

  const payload = {
    sub: user.id,
    email: user.email,
    roleId: user.roleId ?? null,
    companyId: user.companyId ?? null,
    branchId: user.branchId ?? null,
  };

  const accessToken = await signAccessToken(payload);

  const refreshPlain = generateOpaqueToken(32);
  const refreshHash = await sha256HexAsync(refreshPlain);
  const refreshExpSec = parseDurationToSeconds(env.JWT_REFRESH_EXPIRES);
  const refreshExpiresAt = new Date(Date.now() + refreshExpSec * 1000);

  await insertRefreshTokenRepo({
    userId: user.id,
    tokenHash: refreshHash,
    expiresAt: refreshExpiresAt,
    userAgent: ua,
    ip,
  });

  return {
    tokens: { accessToken, refreshToken: refreshPlain },
    user: {
      id: user.id,
      email: user.email,
      fullname: user.fullname,
      roleId: user.roleId ?? null,
      companyId: user.companyId ?? null,
      branchId: user.branchId ?? null,
    },
  };
}

export async function refreshSvc(refreshToken: string) {
  const hash = await sha256HexAsync(refreshToken);
  const current = await findRefreshTokenRepo(hash);
  if (!current) throw new Error('Invalid refresh token');
  if (current.revokedAt) throw new Error('Token revoked');
  if (current.expiresAt.getTime() <= Date.now()) throw new Error('Token expired');

  const user = await getUserByIdRepo(current.userId);
  if (!user) throw new Error('Invalid refresh token');

  // Rotate
  const nextPlain = generateOpaqueToken(32);
  const nextHash = await sha256HexAsync(nextPlain);
  const refreshExpSec = parseDurationToSeconds(env.JWT_REFRESH_EXPIRES);
  const nextExpiresAt = new Date(Date.now() + refreshExpSec * 1000);
  await rotateRefreshTokenRepo(hash, nextHash, nextExpiresAt);

  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    roleId: user.roleId ?? null,
    companyId: user.companyId ?? null,
    branchId: user.branchId ?? null,
  });

  return { accessToken, refreshToken: nextPlain };
}

export async function logoutSvc(refreshToken: string) {
  const hash = await sha256HexAsync(refreshToken);
  const current = await findRefreshTokenRepo(hash);
  if (current) {
    await revokeRefreshTokenRepo(hash);
  }
}

// export async function forgotPasswordSvc(email: string) {
//   const user = await getUserByEmailRepo(email);
//   // Always respond success to avoid user enumeration
//   if (!user) return;

//   const tokenPlain = generateOpaqueToken(32);
//   const tokenHash = await sha256HexAsync(tokenPlain);
//   const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

//   await insertPasswordResetRepo({ userId: user.id, tokenHash, expiresAt });

//   // Send email with token link
//   const resetUrl = `${
//     process.env.APP_BASE_URL || 'http://localhost:3000'
//   }/reset-password?token=${tokenPlain}`;
//   // Replace with real mailer integration later
//   console.log(`Password reset link for ${email}: ${resetUrl}`);
// }

export async function forgotPasswordSvc(email: string) {
  const user = await getUserByEmailRepo(email);
  console.log(user, 'user', email);
  // Always respond success to avoid user enumeration
  if (!user) return;

  const tokenPlain = randomBytes(32).toString('hex');
  const enc = new TextEncoder().encode(tokenPlain);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  const tokenHash = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  await insertPasswordResetRepo({ userId: user.id, tokenHash, expiresAt });

  const resetUrl = `${env.APP_BASE_URL}/reset-password?token=${tokenPlain}`;

  try {
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (err) {
    // Do not leak details to the client; log for operators
    console.error('Failed to send password reset email:', err);
    // You can also capture with Sentry here if desired
    // Sentry.captureException(err);
  }
}
export async function resetPasswordSvc(token: string, newPassword: string) {
  const tokenHash = await sha256HexAsync(token);
  const record = await findPasswordResetRepo(tokenHash);
  if (!record) throw new Error('Invalid token');
  if (record.usedAt) throw new Error('Token already used');
  if (record.expiresAt.getTime() <= Date.now()) throw new Error('Token expired');

  const passwordHash = await hashPassword(newPassword);
  await updateUserPasswordRepo(record.userId, passwordHash);
  await markPasswordResetUsedRepo(tokenHash);
  await revokeAllUserTokensRepo(record.userId);
}

export async function changePasswordSvc(userId: string, oldPassword: string, newPassword: string) {
  const user = await getUserByIdRepo(userId);
  if (!user) throw new Error('User not found');

  const ok = await verifyPassword(oldPassword, user.password);
  if (!ok) throw new Error('Invalid credentials');

  const passwordHash = await hashPassword(newPassword);
  await updateUserPasswordRepo(user.id, passwordHash);
  await revokeAllUserTokensRepo(user.id);
}
