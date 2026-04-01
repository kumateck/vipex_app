import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/config';
import { commCallSessions } from '@/db/schemas';
import type {
  CommunicationCallsCreateLivekitTokenInput,
  CommunicationCallsCreateInput,
  CommunicationCallsItem,
  CommunicationCallsListInput,
  CommunicationCallsUpdateStatusInput,
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

export async function updateCommunicationCallStatusRepo(
  input: Pick<CommunicationCallsUpdateStatusInput, 'companyId' | 'id' | 'status'>,
): Promise<CommunicationCallsItem> {
  const now = new Date();
  const [updated] = await db
    .update(commCallSessions)
    .set({
      status: input.status,
      startedAt: input.status === 'active' ? now : undefined,
      endedAt: input.status === 'ended' || input.status === 'cancelled' ? now : undefined,
      updatedAt: now,
    })
    .where(and(eq(commCallSessions.id, input.id), eq(commCallSessions.companyId, input.companyId)))
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

  if (!updated) throw new Error('Call session not found');
  return {
    ...updated,
    startedAt: updated.startedAt ? updated.startedAt.toISOString() : null,
    endedAt: updated.endedAt ? updated.endedAt.toISOString() : null,
    createdAt: updated.createdAt ? updated.createdAt.toISOString() : null,
    updatedAt: updated.updatedAt ? updated.updatedAt.toISOString() : null,
  };
}

export async function getCommunicationCallByIdRepo(
  input: Pick<CommunicationCallsCreateLivekitTokenInput, 'companyId' | 'id'>,
): Promise<CommunicationCallsItem | null> {
  const [row] = await db
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
    .where(and(eq(commCallSessions.id, input.id), eq(commCallSessions.companyId, input.companyId)))
    .limit(1);

  if (!row) return null;
  return {
    ...row,
    startedAt: row.startedAt ? row.startedAt.toISOString() : null,
    endedAt: row.endedAt ? row.endedAt.toISOString() : null,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  };
}

export async function getLatestOpenChannelCallRepo(input: {
  companyId: string;
  channelId: string;
}): Promise<CommunicationCallsItem | null> {
  const [row] = await db
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
    .where(
      and(
        eq(commCallSessions.companyId, input.companyId),
        eq(commCallSessions.channelId, input.channelId),
        inArray(commCallSessions.status, ['pending', 'ringing', 'active']),
      ),
    )
    .orderBy(desc(commCallSessions.createdAt), desc(commCallSessions.id))
    .limit(1);

  if (!row) return null;
  return {
    ...row,
    startedAt: row.startedAt ? row.startedAt.toISOString() : null,
    endedAt: row.endedAt ? row.endedAt.toISOString() : null,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  };
}
