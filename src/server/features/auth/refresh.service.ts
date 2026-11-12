import { env } from '@/server/utils/env';
import { HttpError } from '@/server/utils/http-error';
import { HttpStatus } from '@/server/utils/http-status';
import { parseDurationToSeconds } from '@/server/utils/duration';
import { generateOpaqueToken, sha256HexAsync } from '@/server/utils/otp';
import { signAccessToken } from '@/server/utils/jwt';
import { UserStatus } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import type { BranchSwitchChoice } from '@/shared/auth/branch-switch';
import {
  findApprovedDeviceSvc,
  requireApprovedDeviceSvc,
  type DeviceCredential,
} from './device.service';
import { isDeviceVerificationRequired } from './device-policy';
import { touchDeviceRepo } from './device.repository';
import { getSwitchedSessionScope, resolveBranchSwitch } from './branch-session.service';
import {
  findRefreshTokenRepo,
  getUserByIdRepo,
  listRolePermissionKeysRepo,
  rotateRefreshTokenRepo,
} from './repository';

export async function refreshSvc(
  refreshToken: string,
  deviceCredential?: DeviceCredential | null,
  client?: 'mobile' | 'desktop' | null,
  switchBranch?: BranchSwitchChoice,
) {
  const hash = await sha256HexAsync(refreshToken);
  const current = await findRefreshTokenRepo(hash);
  if (!current) throw new HttpError(HttpStatus.UNAUTHORIZED, 'Invalid refresh token');
  if (current.revokedAt) throw new HttpError(HttpStatus.UNAUTHORIZED, 'Token revoked');
  if (current.expiresAt.getTime() <= Date.now())
    throw new HttpError(HttpStatus.UNAUTHORIZED, 'Token expired');
  const user = await getUserByIdRepo(current.userId);
  if (!user) throw new HttpError(HttpStatus.UNAUTHORIZED, 'Invalid refresh token');
  if ((client || current.deviceId) && user.status !== UserStatus.ACTIVE) {
    throw new HttpError(HttpStatus.UNAUTHORIZED, 'Account unavailable');
  }
  const verificationRequired =
    Boolean(client || current.deviceId) && (await isDeviceVerificationRequired(user.companyId));
  if (verificationRequired && client && !current.deviceId) {
    throw new HttpError(HttpStatus.UNAUTHORIZED, 'Native session requires device registration');
  }
  if (verificationRequired && current.deviceId) {
    const device = await requireApprovedDeviceSvc(deviceCredential ?? null, current.userId);
    if (device.id !== current.deviceId) {
      throw new HttpError(HttpStatus.UNAUTHORIZED, 'Device session mismatch');
    }
    await touchDeviceRepo(device.id);
  }
  // Not enforced yet: attach an approved device to an unlinked native session on refresh.
  const bindDevice =
    !verificationRequired && client && !current.deviceId
      ? await findApprovedDeviceSvc(deviceCredential ?? null, current.userId, client)
      : null;

  const stored = current.activeBranchId
    ? await getSwitchedSessionScope(current.userId, {
        branchId: current.activeBranchId,
        locationId: current.activeLocationId,
      })
    : null;
  if (current.activeBranchId && !stored) {
    throw new HttpError(HttpStatus.UNAUTHORIZED, 'Branch access expired. Sign in again.');
  }
  const selected = switchBranch ? await resolveBranchSwitch(user.id, switchBranch) : null;
  const scope = selected?.scope ?? stored?.scope;
  const branch = scope?.branch ?? user.branch;
  const location = scope ? scope.location : user.location;
  const locationId = scope ? (location?.id ?? null) : user.locationId;
  const permissionKeys = selected
    ? await listRolePermissionKeysRepo(selected.account.roleId, selected.account.companyId)
    : (stored?.permissions ??
      (Array.isArray(current.permissionsSnapshot) && current.permissionsSnapshot.length > 0
        ? current.permissionsSnapshot
        : await listRolePermissionKeysRepo(user.roleId, user.companyId)));
  if (
    selected &&
    (selected.account.companyId !== user.companyId ||
      selected.account.roleId !== user.roleId ||
      selected.account.branchId !== user.branchId ||
      selected.account.locationId !== user.locationId ||
      !permissionKeys.includes(PermissionKeys.CanSwitchBranch))
  )
    throw new HttpError(HttpStatus.FORBIDDEN, 'Branch access changed. Try again.');

  const hasOverride =
    scope && (scope.branch.id !== user.branchId || locationId !== user.locationId);
  const previousBranchId = current.activeBranchId ?? user.branchId;
  const previousLocationId = current.activeBranchId ? current.activeLocationId : user.locationId;
  const branchChanged =
    selected && (previousBranchId !== branch?.id || previousLocationId !== locationId);

  const nextPlain = generateOpaqueToken(32);
  const nextHash = await sha256HexAsync(nextPlain);
  const refreshExpSec = parseDurationToSeconds(env.JWT_REFRESH_EXPIRES);
  const nextRefresh = await rotateRefreshTokenRepo({
    previousHash: hash,
    nextHash,
    expiresAt: new Date(Date.now() + refreshExpSec * 1000),
    permissions: permissionKeys,
    deviceId: bindDevice?.id,
    activeBranchId: hasOverride ? scope.branch.id : null,
    activeLocationId: hasOverride ? locationId : null,
    audit: branchChanged
      ? {
          companyId: user.companyId,
          actorUserId: user.id,
          entityType: 'user',
          entityId: user.id,
          action: 'AUTH_BRANCH_SWITCHED',
          message: 'Active session branch switched',
          metadata: {
            fromBranchId: previousBranchId,
            fromLocationId: previousLocationId,
            branchId: branch?.id,
            locationId,
          },
        }
      : undefined,
  });
  if (!nextRefresh) throw new HttpError(HttpStatus.UNAUTHORIZED, 'Token revoked');

  const accessToken = await signAccessToken({
    sub: user.id,
    sid: nextRefresh.id,
    email: user.email,
    employeeId: user.employeeId ?? null,
    roleId: user.roleId ?? null,
    companyId: user.companyId ?? null,
    branchId: branch?.id ?? user.branchId ?? null,
    branchType: branch?.type ?? null,
    locationId: locationId ?? null,
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
      branch,
      location,
      locationId: locationId ?? null,
      locationName: location?.name ?? null,
      userType: user.userType ?? null,
      cashierType: user.cashierType ?? null,
      permissions: permissionKeys,
    },
  };
}
