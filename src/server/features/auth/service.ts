import { randomBytes } from 'node:crypto';
import { hashPassword, verifyPassword } from '../../utils/password';
import { signAccessToken } from '../../utils/jwt';
import {
  findRefreshTokenRepo,
  getUserByEmailRepo,
  getUserByIdRepo,
  insertRefreshTokenRepo,
  listRolePermissionKeysRepo,
  revokeAllUserTokensRepo,
  revokeRefreshTokenRepo,
  rotateRefreshTokenRepo,
  updateCurrentUserProfileRepo,
  updateUserPasswordRepo,
} from './repository';
import { env } from '../../utils/env';
import { parseDurationToSeconds } from '../../utils/duration';
import { sendPasswordResetEmail } from '@/server/services/mail/templates/password-reset';
import { UserStatus } from '@/db/schemas/enums';
import { HttpError } from '@/server/utils/http-error';
import { HttpStatus } from '@/server/utils/http-status';
import {
  clearUserResetTokenRepo,
  findUserByEmailAndResetTokenRepo,
  setPasswordAndActivateUserRepo,
  setUserResetTokenRepo,
} from './repository.tokens';

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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function generateOtpCode() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

async function hashEmailOtp(email: string, otp: string) {
  return sha256HexAsync(`${normalizeEmail(email)}:${otp.trim()}`);
}

export async function loginSvc(email: string, password: string, ua?: string, ip?: string) {
  const user = await getUserByEmailRepo(email);
  if (!user || user === null) throw new HttpError(HttpStatus.UNAUTHORIZED, 'Invalid credentials');
  if (user.status === UserStatus.INVITED) {
    throw new HttpError(
      HttpStatus.FORBIDDEN,
      'Account setup pending. Use your invite OTP on the Set Password page.',
    );
  }
  if (user.status && user.status !== UserStatus.ACTIVE)
    throw new HttpError(HttpStatus.FORBIDDEN, 'Account disabled');
  const ok = await verifyPassword(password, user?.password);
  if (!ok) throw new HttpError(HttpStatus.UNAUTHORIZED, 'Invalid credentials');
  const permissionKeys = await listRolePermissionKeysRepo(user.roleId, user.companyId);
  const refreshPlain = generateOpaqueToken(32);
  const refreshHash = await sha256HexAsync(refreshPlain);
  const refreshExpSec = parseDurationToSeconds(env.JWT_REFRESH_EXPIRES);
  const refreshExpiresAt = new Date(Date.now() + refreshExpSec * 1000);

  await insertRefreshTokenRepo({
    userId: user.id,
    tokenHash: refreshHash,
    expiresAt: refreshExpiresAt,
    permissionsSnapshot: permissionKeys,
    userAgent: ua,
    ip,
  });

  const persistedRefresh = await findRefreshTokenRepo(refreshHash);
  if (!persistedRefresh) throw new HttpError(HttpStatus.UNAUTHORIZED, 'Invalid refresh token');

  const accessToken = await signAccessToken({
    sub: user.id,
    sid: persistedRefresh.id,
    email: user.email,
    employeeId: user.employeeId ?? null,
    roleId: user.roleId ?? null,
    companyId: user.companyId ?? null,
    branchId: user.branchId ?? null,
    branchType: user.branch?.type ?? null,
    locationId: user.locationId ?? null,
    userType: user.userType ?? null,
    cashierType: user.cashierType ?? null,
  });
  return {
    tokens: { accessToken, refreshToken: refreshPlain },
    user: {
      id: user.id,
      email: user.email,
      fullname: user.fullname,
      employeeId: user.employeeId ?? null,
      role: user.role ?? null,
      company: user.company ?? null,
      branch: user.branch ?? null,
      location: user.location ?? null,
      locationId: user.locationId ?? null,
      locationName: user.location?.name ?? null,
      userType: user.userType ?? null,
      cashierType: user.cashierType ?? null,
      permissions: permissionKeys,
    },
  };
}

export async function refreshSvc(refreshToken: string) {
  const hash = await sha256HexAsync(refreshToken);
  const current = await findRefreshTokenRepo(hash);
  if (!current) throw new HttpError(HttpStatus.UNAUTHORIZED, 'Invalid refresh token');
  if (current.revokedAt) throw new HttpError(HttpStatus.UNAUTHORIZED, 'Token revoked');
  if (current.expiresAt.getTime() <= Date.now())
    throw new HttpError(HttpStatus.UNAUTHORIZED, 'Token expired');

  const user = await getUserByIdRepo(current.userId);
  if (!user) throw new HttpError(HttpStatus.UNAUTHORIZED, 'Invalid refresh token');
  const permissionKeys =
    Array.isArray(current.permissionsSnapshot) && current.permissionsSnapshot.length > 0
      ? current.permissionsSnapshot
      : await listRolePermissionKeysRepo(user.roleId, user.companyId);

  // Rotate
  const nextPlain = generateOpaqueToken(32);
  const nextHash = await sha256HexAsync(nextPlain);
  const refreshExpSec = parseDurationToSeconds(env.JWT_REFRESH_EXPIRES);
  const nextExpiresAt = new Date(Date.now() + refreshExpSec * 1000);
  await rotateRefreshTokenRepo(hash, nextHash, nextExpiresAt, permissionKeys);

  const nextRefresh = await findRefreshTokenRepo(nextHash);
  if (!nextRefresh) throw new HttpError(HttpStatus.UNAUTHORIZED, 'Invalid refresh token');

  const accessToken = await signAccessToken({
    sub: user.id,
    sid: nextRefresh.id,
    email: user.email,
    employeeId: user.employeeId ?? null,
    roleId: user.roleId ?? null,
    companyId: user.companyId ?? null,
    branchId: user.branchId ?? null,
    branchType: user.branch?.type ?? null,
    locationId: user.locationId ?? null,
    userType: user.userType ?? null,
    cashierType: user.cashierType ?? null,
  });

  return {
    accessToken,
    refreshToken: nextPlain,
    user: {
      id: user.id,
      email: user.email,
      fullname: user.fullname,
      employeeId: user.employeeId ?? null,
      role: user.role ?? null,
      company: user.company ?? null,
      branch: user.branch ?? null,
      location: user.location ?? null,
      locationId: user.locationId ?? null,
      locationName: user.location?.name ?? null,
      userType: user.userType ?? null,
      cashierType: user.cashierType ?? null,
      permissions: permissionKeys,
    },
  };
}

export async function logoutSvc(refreshToken: string) {
  const hash = await sha256HexAsync(refreshToken);
  const current = await findRefreshTokenRepo(hash);
  if (current) {
    await revokeRefreshTokenRepo(hash);
  }
}

export async function forgotPasswordSvc(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const user = await getUserByEmailRepo(normalizedEmail);

  // Always respond success to avoid user enumeration
  if (!user) return;

  const otp = generateOtpCode();
  const tokenHash = await hashEmailOtp(normalizedEmail, otp);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await setUserResetTokenRepo({ userId: user.id, tokenHash, expiresAt });

  try {
    await sendPasswordResetEmail(user.email, otp);
  } catch (err) {
    // Do not leak details to the client; log for operators
    console.error('Failed to send password reset email:', err);
    // You can also capture with Sentry here if desired
    // Sentry.captureException(err);
  }
}
export async function resetPasswordSvc(email: string, otp: string, newPassword: string) {
  const normalizedEmail = normalizeEmail(email);
  const tokenHash = await hashEmailOtp(normalizedEmail, otp);
  const user = await findUserByEmailAndResetTokenRepo(normalizedEmail, tokenHash);
  if (!user) throw new HttpError(HttpStatus.UNAUTHORIZED, 'Invalid or expired OTP');
  if (user.status === UserStatus.INVITED) {
    throw new HttpError(
      HttpStatus.BAD_REQUEST,
      'This OTP is for account setup. Please use Set Password.',
    );
  }
  const passwordHash = await hashPassword(newPassword);
  await updateUserPasswordRepo(user.id, passwordHash);
  await clearUserResetTokenRepo(user.id);
  await revokeAllUserTokensRepo(user.id);
}

export async function setPasswordSvc(email: string, otp: string, newPassword: string) {
  const normalizedEmail = normalizeEmail(email);
  const tokenHash = await hashEmailOtp(normalizedEmail, otp);
  const user = await findUserByEmailAndResetTokenRepo(normalizedEmail, tokenHash);
  if (!user) throw new HttpError(HttpStatus.UNAUTHORIZED, 'Invalid or expired OTP');
  if (user.status !== UserStatus.INVITED) {
    throw new HttpError(HttpStatus.BAD_REQUEST, 'User is not in invited state');
  }

  const passwordHash = await hashPassword(newPassword);
  await setPasswordAndActivateUserRepo({ userId: user.id, passwordHash, setActiveIfInvited: true });
  await clearUserResetTokenRepo(user.id);
  await revokeAllUserTokensRepo(user.id);
}

export async function changePasswordSvc(userId: string, oldPassword: string, newPassword: string) {
  const user = await getUserByIdRepo(userId);
  if (!user) throw new HttpError(HttpStatus.UNAUTHORIZED, 'User not found');

  const ok = await verifyPassword(oldPassword, user.password);
  if (!ok) throw new HttpError(HttpStatus.UNAUTHORIZED, 'Invalid credentials');

  const passwordHash = await hashPassword(newPassword);
  await updateUserPasswordRepo(user.id, passwordHash);
  await revokeAllUserTokensRepo(user.id);
}

export async function verifyCurrentUserPasswordSvc(userId: string, password: string) {
  const user = await getUserByIdRepo(userId);
  if (!user) throw new HttpError(HttpStatus.UNAUTHORIZED, 'User not found');

  const ok = await verifyPassword(password, user.password);
  if (!ok) throw new HttpError(HttpStatus.UNAUTHORIZED, 'Invalid password');

  return { success: true };
}

export async function getCurrentUserPermissionsSvc(userId: string) {
  const user = await getUserByIdRepo(userId);
  if (!user) throw new HttpError(HttpStatus.UNAUTHORIZED, 'User not found');

  const permissionKeys = await listRolePermissionKeysRepo(user.roleId, user.companyId);
  const allPermissions = permissionKeys;
  const readOnlyPermissions = allPermissions.filter((permission) =>
    /^Can(Read|List|Get)/.test(permission),
  );

  return { allPermissions, readOnlyPermissions };
}

export async function getCurrentUserProfileSvc(userId: string) {
  const user = await getUserByIdRepo(userId);
  if (!user) throw new HttpError(HttpStatus.UNAUTHORIZED, 'User not found');

  return {
    id: user.id,
    fullname: user.fullname,
    email: user.email,
    telephone: user.telephone,
    employeeId: user.employeeId ?? null,
    role: user.role ?? null,
    branch: user.branch ?? null,
    company: user.company ?? null,
    location: user.location ?? null,
    locationId: user.locationId ?? null,
    locationName: user.location?.name ?? null,
    userType: user.userType ?? null,
    cashierType: user.cashierType ?? null,
  };
}

export async function updateCurrentUserProfileSvc(
  userId: string,
  patch: { fullname?: string; telephone?: string },
) {
  const updates: { fullname?: string; telephone?: string } = {};

  if (patch.fullname !== undefined) {
    const fullname = patch.fullname.trim();
    if (!fullname) throw new HttpError(HttpStatus.BAD_REQUEST, 'Full name is required');
    updates.fullname = fullname;
  }

  if (patch.telephone !== undefined) {
    const telephone = patch.telephone.trim();
    if (!telephone) throw new HttpError(HttpStatus.BAD_REQUEST, 'Telephone is required');
    updates.telephone = telephone;
  }

  if (!Object.keys(updates).length) {
    throw new HttpError(HttpStatus.BAD_REQUEST, 'No profile fields provided');
  }

  const updated = await updateCurrentUserProfileRepo(userId, updates);
  if (!updated) throw new HttpError(HttpStatus.UNAUTHORIZED, 'User not found');

  return getCurrentUserProfileSvc(userId);
}
