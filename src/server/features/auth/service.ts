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
  updateCurrentUserProfileRepo,
  updateUserPasswordRepo,
} from './repository';
import { env } from '../../utils/env';
import { parseDurationToSeconds } from '../../utils/duration';
import { sendPasswordResetEmail } from '@/server/services/mail/templates/password-reset';
import { UserStatus } from '@/db/schemas/enums';
import { HttpError } from '@/server/utils/http-error';
import { HttpStatus } from '@/server/utils/http-status';
import { logger } from '@/server/utils/logger';
import { generateOpaqueToken, generateOtpCode, hashOtp, sha256HexAsync } from '@/server/utils/otp';
import {
  clearUserResetTokenRepo,
  findUserByEmailAndResetTokenRepo,
  setPasswordAndActivateUserRepo,
  setUserResetTokenRepo,
} from './repository.tokens';
import {
  findApprovedDeviceSvc,
  requireApprovedDeviceSvc,
  type DeviceCredential,
} from './device.service';
import { touchDeviceRepo } from './device.repository';
import { isDeviceVerificationRequired } from './device-policy';

import type { BranchSessionScope } from './branch-session.service';

export { refreshSvc } from './refresh.service';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function hashEmailOtp(email: string, otp: string) {
  return hashOtp(normalizeEmail(email), otp);
}

export async function loginSvc(
  email: string,
  password: string,
  ua?: string,
  ip?: string,
  client?: 'mobile' | 'desktop' | null,
  deviceCredential?: DeviceCredential | null,
) {
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
  // Enforced: an approved device is required. Not enforced: link an already-approved device so
  // enabling the module later keeps this session, but never block sign-in.
  const device = !client
    ? null
    : (await isDeviceVerificationRequired(user.companyId))
      ? await requireApprovedDeviceSvc(deviceCredential ?? null, user.id, client)
      : await findApprovedDeviceSvc(deviceCredential ?? null, user.id, client);
  if (device) await touchDeviceRepo(device.id);
  const permissionKeys = await listRolePermissionKeysRepo(user.roleId, user.companyId);
  const refreshPlain = generateOpaqueToken(32);
  const refreshHash = await sha256HexAsync(refreshPlain);
  const refreshExpSec = parseDurationToSeconds(env.JWT_REFRESH_EXPIRES);
  const refreshExpiresAt = new Date(Date.now() + refreshExpSec * 1000);

  await insertRefreshTokenRepo({
    userId: user.id,
    deviceId: device?.id ?? null,
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

export async function logoutSvc(refreshToken: string) {
  const hash = await sha256HexAsync(refreshToken);
  const current = await findRefreshTokenRepo(hash);
  if (current) {
    await revokeRefreshTokenRepo(hash);
  }
}

export async function forgotPasswordSvc(email: string) {
  const normalizedEmail = normalizeEmail(email);
  logger.info('[AUTH_FORGOT] request received', { email: normalizedEmail });
  const user = await getUserByEmailRepo(normalizedEmail);

  // Always respond success to avoid user enumeration
  if (!user) {
    logger.info('[AUTH_FORGOT] user not found, skipping email send', { email: normalizedEmail });
    return;
  }

  const otp = generateOtpCode();
  const tokenHash = await hashEmailOtp(normalizedEmail, otp);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await setUserResetTokenRepo({ userId: user.id, tokenHash, expiresAt });
  logger.info('[AUTH_FORGOT] reset token stored', { userId: user.id, email: normalizedEmail });

  try {
    logger.info('[AUTH_FORGOT] attempting email send', { userId: user.id, to: user.email });
    await sendPasswordResetEmail(user.email, otp);
    logger.info('[AUTH_FORGOT] email send completed', { userId: user.id, to: user.email });
  } catch (err) {
    // Do not leak details to the client; log for operators
    console.error('Failed to send password reset email:', err);
    logger.error('[AUTH_FORGOT] email send failed', {
      userId: user.id,
      to: user.email,
      error: err instanceof Error ? err.message : String(err),
    });
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

export async function getCurrentUserProfileSvc(userId: string, scope?: BranchSessionScope) {
  const user = await getUserByIdRepo(userId);
  if (!user) throw new HttpError(HttpStatus.UNAUTHORIZED, 'User not found');

  const location = scope ? scope.location : user.location;
  return {
    id: user.id,
    fullname: user.fullname,
    email: user.email,
    telephone: user.telephone,
    employeeId: user.employeeId ?? null,
    role: user.role ?? null,
    branch: scope?.branch ?? user.branch,
    company: user.company ?? null,
    location,
    locationId: scope ? (location?.id ?? null) : (user.locationId ?? null),
    locationName: location?.name ?? null,
    userType: user.userType ?? null,
    cashierType: user.cashierType ?? null,
  };
}

export async function updateCurrentUserProfileSvc(
  userId: string,
  patch: { fullname?: string; telephone?: string },
  scope?: BranchSessionScope,
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

  return getCurrentUserProfileSvc(userId, scope);
}
