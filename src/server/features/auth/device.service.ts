import { verifyPassword } from '@/server/utils/password';
import { BadRequest, Conflict, Forbidden, NotFound, Unauthorized } from '@/server/utils/http-error';
import { generateOpaqueToken, sha256HexAsync } from '@/server/utils/otp';
import { UserStatus } from '@/db/schemas/enums';
import { recordAuditLog } from '@/server/features/audit/logger';
import { disconnectCommunicationDeviceSockets } from '@/server/features/communication/realtime';
import { getUserByEmailRepo } from './repository';
import {
  findDeviceByCredentialRepo,
  findDeviceRepo,
  insertDeviceRepo,
  listDevicesRepo,
  transitionDeviceRepo,
  type DeviceStatus,
} from './device.repository';

export type DeviceCredential = { id: string; secret: string };

export async function registerDeviceSvc(input: {
  email: string;
  password: string;
  kind: 'mobile' | 'desktop';
  deviceName: string;
  model?: string | null;
  osName: string;
  osVersion?: string | null;
  appVersion?: string | null;
  userAgent?: string | null;
  ip?: string | null;
}) {
  const user = await getUserByEmailRepo(input.email);
  if (!user || !(await verifyPassword(input.password, user.password))) {
    throw Unauthorized('Invalid credentials');
  }
  if ((user.status && user.status !== UserStatus.ACTIVE) || !user.companyId)
    throw Forbidden('Account unavailable');
  const secret = generateOpaqueToken(32);
  const row = await insertDeviceRepo({
    userId: user.id,
    companyId: user.companyId,
    kind: input.kind,
    secretHash: await sha256HexAsync(secret),
    deviceName: input.deviceName.trim(),
    model: input.model?.trim() || null,
    osName: input.osName.trim(),
    osVersion: input.osVersion?.trim() || null,
    appVersion: input.appVersion?.trim() || null,
    userAgent: input.userAgent,
    requestedIp: input.ip,
  });
  await recordAuditLog({
    companyId: user.companyId,
    actorUserId: user.id,
    entityType: 'registered_device',
    entityId: row.id,
    action: 'DEVICE_REGISTRATION_REQUESTED',
    metadata: { kind: row.kind, deviceName: row.deviceName },
  });
  return { id: row.id, secret, status: 'pending' as const };
}

export async function getDeviceByCredentialSvc(credential: DeviceCredential) {
  if (!credential.id || !credential.secret) return null;
  return findDeviceByCredentialRepo(credential.id, await sha256HexAsync(credential.secret));
}

export async function getDeviceStatusSvc(credential: DeviceCredential) {
  const device = await getDeviceByCredentialSvc(credential);
  if (!device) throw Unauthorized('Unknown device credential');
  return { id: device.id, status: device.status as DeviceStatus };
}

export function deviceAccessFailure(
  device: {
    userId: string;
    kind: string;
    status: string;
    userStatus: number;
  } | null,
  userId: string,
  kind?: 'mobile' | 'desktop',
): string | null {
  if (!device || device.userId !== userId || (kind && device.kind !== kind)) {
    return 'Device credential does not match this account';
  }
  if (device.userStatus !== UserStatus.ACTIVE) return 'Account unavailable';
  if (device.status !== 'approved') {
    return `Device ${device.status.replaceAll('_', ' ')}; contact an administrator`;
  }
  return null;
}

export async function requireApprovedDeviceSvc(
  credential: DeviceCredential | null,
  userId: string,
  kind?: 'mobile' | 'desktop',
) {
  if (!credential) throw Forbidden('Register this device before signing in');
  const device = await getDeviceByCredentialSvc(credential);
  const failure = deviceAccessFailure(device, userId, kind);
  if (failure || !device) throw Forbidden(failure ?? 'Device credential is invalid');
  return device;
}

const ALLOWED_TRANSITIONS: Record<DeviceStatus, readonly DeviceStatus[]> = {
  pending: ['approved', 'blocked', 'permanently_denied'],
  approved: ['revoked', 'blocked', 'permanently_denied'],
  revoked: ['approved', 'blocked', 'permanently_denied'],
  blocked: ['pending', 'permanently_denied'],
  permanently_denied: [],
};

export function canReviewDevice(
  current: DeviceStatus,
  action: 'approve' | 'revoke' | 'block' | 'unblock' | 'permanently_deny',
) {
  const next: DeviceStatus = {
    approve: 'approved',
    revoke: 'revoked',
    block: 'blocked',
    unblock: 'pending',
    permanently_deny: 'permanently_denied',
  }[action] as DeviceStatus;
  return { next, allowed: ALLOWED_TRANSITIONS[current]?.includes(next) ?? false };
}

export async function reviewDeviceSvc(input: {
  id: string;
  companyId: string;
  reviewerId: string;
  action: 'approve' | 'revoke' | 'block' | 'unblock' | 'permanently_deny';
  reason?: string;
}) {
  const device = await findDeviceRepo(input.id);
  if (!device || device.companyId !== input.companyId) throw NotFound('Device not found');
  if (device.userId === input.reviewerId && input.action === 'approve') {
    throw Forbidden('You cannot approve your own device');
  }
  if (['revoke', 'block', 'permanently_deny'].includes(input.action) && !input.reason?.trim()) {
    throw BadRequest('A reason is required for this action');
  }
  const current = device.status as DeviceStatus;
  const { next, allowed } = canReviewDevice(current, input.action);
  if (!allowed) {
    throw Conflict(`Cannot ${input.action.replaceAll('_', ' ')} a ${current} device`);
  }
  const updated = await transitionDeviceRepo({
    id: device.id,
    companyId: input.companyId,
    from: current,
    to: next,
    reviewerId: input.reviewerId,
    reason: input.reason?.trim(),
  });
  if (!updated) throw Conflict('Device status changed; reload and try again');
  if (next !== 'approved') disconnectCommunicationDeviceSockets(updated.id);
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.reviewerId,
    entityType: 'registered_device',
    entityId: updated.id,
    action: `DEVICE_${input.action.toUpperCase()}`,
    metadata: { from: current, to: next, targetUserId: updated.userId, reason: input.reason },
  });
  return { id: updated.id, status: updated.status as DeviceStatus };
}

export async function listDevicesSvc(companyId: string) {
  return listDevicesRepo(companyId);
}
