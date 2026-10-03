import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/config';
import { registeredDevices, refreshTokens, users } from '@/db/schemas';

export type DeviceStatus = 'pending' | 'approved' | 'revoked' | 'blocked' | 'permanently_denied';

export async function insertDeviceRepo(input: {
  userId: string;
  companyId: string;
  kind: 'mobile' | 'desktop';
  secretHash: string;
  deviceName: string;
  model?: string | null;
  osName: string;
  osVersion?: string | null;
  appVersion?: string | null;
  userAgent?: string | null;
  requestedIp?: string | null;
}) {
  const [row] = await db.insert(registeredDevices).values(input).returning();
  return row!;
}

export async function findDeviceRepo(id: string) {
  const [row] = await db.select().from(registeredDevices).where(eq(registeredDevices.id, id));
  return row ?? null;
}

export async function findDeviceByCredentialRepo(id: string, secretHash: string) {
  const [row] = await db
    .select({ device: registeredDevices, userStatus: users.status })
    .from(registeredDevices)
    .innerJoin(users, eq(users.id, registeredDevices.userId))
    .where(and(eq(registeredDevices.id, id), eq(registeredDevices.secretHash, secretHash)));
  return row ? { ...row.device, userStatus: row.userStatus } : null;
}

export async function touchDeviceRepo(id: string) {
  await db
    .update(registeredDevices)
    .set({ lastSeenAt: new Date() })
    .where(eq(registeredDevices.id, id));
}

export async function listDevicesRepo(companyId: string) {
  return db
    .select({
      id: registeredDevices.id,
      userId: registeredDevices.userId,
      userName: users.fullname,
      userEmail: users.email,
      kind: registeredDevices.kind,
      status: registeredDevices.status,
      deviceName: registeredDevices.deviceName,
      model: registeredDevices.model,
      osName: registeredDevices.osName,
      osVersion: registeredDevices.osVersion,
      appVersion: registeredDevices.appVersion,
      createdAt: registeredDevices.createdAt,
      reviewedAt: registeredDevices.reviewedAt,
      reviewedBy: registeredDevices.reviewedBy,
      reviewReason: registeredDevices.reviewReason,
      lastSeenAt: registeredDevices.lastSeenAt,
    })
    .from(registeredDevices)
    .innerJoin(users, eq(users.id, registeredDevices.userId))
    .where(eq(registeredDevices.companyId, companyId))
    .orderBy(desc(registeredDevices.createdAt));
}

export async function transitionDeviceRepo(input: {
  id: string;
  companyId: string;
  from: DeviceStatus;
  to: DeviceStatus;
  reviewerId: string;
  reason?: string | null;
}) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(registeredDevices)
      .set({
        status: input.to,
        reviewedAt: new Date(),
        reviewedBy: input.reviewerId,
        reviewReason: input.reason ?? null,
      })
      .where(
        and(
          eq(registeredDevices.id, input.id),
          eq(registeredDevices.companyId, input.companyId),
          eq(registeredDevices.status, input.from),
        ),
      )
      .returning();
    if (!row) return null;
    if (input.to !== 'approved') {
      await tx
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(and(eq(refreshTokens.deviceId, input.id), isNull(refreshTokens.revokedAt)));
    }
    return row;
  });
}
