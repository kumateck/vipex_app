import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/config';
import { commPushTokens } from '@/db/schemas';

type DevicePlatform = 'ios' | 'android' | 'web' | 'unknown';

function normalizePlatform(platform?: string | null): DevicePlatform {
  if (platform === 'ios' || platform === 'android' || platform === 'web') return platform;
  return 'unknown';
}

export async function registerCommunicationPushToken(input: {
  companyId: string;
  userId: string;
  token: string;
  platform?: string | null;
}) {
  const normalizedToken = input.token.trim();
  if (!normalizedToken) return;

  const now = new Date();
  await db
    .insert(commPushTokens)
    .values({
      companyId: input.companyId,
      userId: input.userId,
      token: normalizedToken,
      platform: normalizePlatform(input.platform),
      isActive: true,
      lastSeenAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [commPushTokens.token],
      set: {
        companyId: input.companyId,
        userId: input.userId,
        platform: normalizePlatform(input.platform),
        isActive: true,
        lastSeenAt: now,
        updatedAt: now,
      },
    });
}

export async function unregisterCommunicationPushToken(input: {
  companyId: string;
  userId: string;
  token: string;
}) {
  const normalizedToken = input.token.trim();
  if (!normalizedToken) return;
  await db
    .update(commPushTokens)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(commPushTokens.companyId, input.companyId),
        eq(commPushTokens.userId, input.userId),
        eq(commPushTokens.token, normalizedToken),
      ),
    );
}

export async function listCommunicationPushTokensForUsers(input: {
  companyId: string;
  userIds: Iterable<string>;
}): Promise<string[]> {
  const normalizedUserIds = [...new Set([...input.userIds].map((id) => id.trim()).filter(Boolean))];
  if (!normalizedUserIds.length) return [];

  const rows = await db
    .select({ token: commPushTokens.token })
    .from(commPushTokens)
    .where(
      and(
        eq(commPushTokens.companyId, input.companyId),
        eq(commPushTokens.isActive, true),
        inArray(commPushTokens.userId, normalizedUserIds),
      ),
    );
  return [...new Set(rows.map((row) => row.token).filter(Boolean))];
}
