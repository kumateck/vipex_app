import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { commCallSessions } from '@/db/schemas';
import type {
  CommunicationCallsCreateInput,
  CommunicationCallsItem,
  CommunicationCallsListInput,
} from './dto';

export async function listCommunicationCallsRepo(
  input: CommunicationCallsListInput,
): Promise<CommunicationCallsItem[]> {
  const where = [eq(commCallSessions.companyId, input.companyId)];
  if (input.threadId) where.push(eq(commCallSessions.threadId, input.threadId));
  if (input.channelId) where.push(eq(commCallSessions.channelId, input.channelId));
  if (input.status) where.push(eq(commCallSessions.status, input.status));

  const rows = await db
    .select({
      id: commCallSessions.id,
      companyId: commCallSessions.companyId,
      threadId: commCallSessions.threadId,
      channelId: commCallSessions.channelId,
      initiatorUserId: commCallSessions.initiatorUserId,
      callType: commCallSessions.callType,
      status: commCallSessions.status,
      livekitRoomName: commCallSessions.livekitRoomName,
      startedAt: commCallSessions.startedAt,
      endedAt: commCallSessions.endedAt,
      createdAt: commCallSessions.createdAt,
      updatedAt: commCallSessions.updatedAt,
    })
    .from(commCallSessions)
    .where(and(...where))
    .orderBy(desc(commCallSessions.createdAt), desc(commCallSessions.id));

  return rows.map((row) => ({
    ...row,
    startedAt: row.startedAt ? row.startedAt.toISOString() : null,
    endedAt: row.endedAt ? row.endedAt.toISOString() : null,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  }));
}

export async function createCommunicationCallsRepo(
  input: CommunicationCallsCreateInput,
): Promise<CommunicationCallsItem> {
  const [created] = await db
    .insert(commCallSessions)
    .values({
      companyId: input.companyId,
      threadId: input.threadId ?? null,
      channelId: input.channelId ?? null,
      initiatorUserId: input.userId,
      callType: input.callType ?? 'audio',
      status: 'ringing',
      livekitRoomName: input.livekitRoomName ?? null,
    })
    .returning({
      id: commCallSessions.id,
      companyId: commCallSessions.companyId,
      threadId: commCallSessions.threadId,
      channelId: commCallSessions.channelId,
      initiatorUserId: commCallSessions.initiatorUserId,
      callType: commCallSessions.callType,
      status: commCallSessions.status,
      livekitRoomName: commCallSessions.livekitRoomName,
      startedAt: commCallSessions.startedAt,
      endedAt: commCallSessions.endedAt,
      createdAt: commCallSessions.createdAt,
      updatedAt: commCallSessions.updatedAt,
    });
  if (!created) throw new Error('Failed to create call session');

  return {
    ...created,
    startedAt: created.startedAt ? created.startedAt.toISOString() : null,
    endedAt: created.endedAt ? created.endedAt.toISOString() : null,
    createdAt: created.createdAt ? created.createdAt.toISOString() : null,
    updatedAt: created.updatedAt ? created.updatedAt.toISOString() : null,
  };
}
