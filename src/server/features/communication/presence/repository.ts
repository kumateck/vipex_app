import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { commPresence, users } from '@/db/schemas';
import type {
  CommunicationPresenceCreateInput,
  CommunicationPresenceItem,
  CommunicationPresenceListInput,
} from './dto';

export async function listCommunicationPresenceRepo(
  input: CommunicationPresenceListInput,
): Promise<CommunicationPresenceItem[]> {
  const rows = await db
    .select({
      id: commPresence.id,
      userId: commPresence.userId,
      status: commPresence.status,
      lastSeenAt: commPresence.lastSeenAt,
      updatedAt: commPresence.updatedAt,
    })
    .from(commPresence)
    .innerJoin(users, eq(users.id, commPresence.userId))
    .where(eq(users.companyId, input.companyId))
    .orderBy(desc(commPresence.updatedAt), desc(commPresence.id));

  return rows.map((row) => ({
    ...row,
    lastSeenAt: row.lastSeenAt ? row.lastSeenAt.toISOString() : null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  }));
}

export async function createCommunicationPresenceRepo(
  input: CommunicationPresenceCreateInput,
): Promise<CommunicationPresenceItem> {
  const now = new Date();
  const [updated] = await db
    .insert(commPresence)
    .values({
      userId: input.userId,
      status: input.status,
      lastSeenAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: commPresence.userId,
      set: {
        status: input.status,
        lastSeenAt: now,
        updatedAt: now,
      },
    })
    .returning({
      id: commPresence.id,
      userId: commPresence.userId,
      status: commPresence.status,
      lastSeenAt: commPresence.lastSeenAt,
      updatedAt: commPresence.updatedAt,
    });
  if (!updated) throw new Error('Failed to update presence');

  return {
    ...updated,
    lastSeenAt: updated.lastSeenAt ? updated.lastSeenAt.toISOString() : null,
    updatedAt: updated.updatedAt ? updated.updatedAt.toISOString() : null,
  };
}
