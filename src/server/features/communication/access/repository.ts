import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  commCallSessions,
  commChannelMembers,
  commChannels,
  commThreadParticipants,
  commThreads,
  users,
} from '@/db/schemas';

export async function isThreadParticipantAccessRepo(input: {
  threadId: string;
  userId: string;
  companyId: string;
}): Promise<boolean> {
  const [row] = await db
    .select({ id: commThreadParticipants.id })
    .from(commThreadParticipants)
    .innerJoin(commThreads, eq(commThreads.id, commThreadParticipants.threadId))
    .where(
      and(
        eq(commThreadParticipants.threadId, input.threadId),
        eq(commThreadParticipants.userId, input.userId),
        eq(commThreadParticipants.isDeleted, false),
        isNull(commThreadParticipants.leftAt),
        eq(commThreads.companyId, input.companyId),
        eq(commThreads.isDeleted, false),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function isChannelMemberAccessRepo(input: {
  channelId: string;
  userId: string;
  companyId: string;
}): Promise<boolean> {
  const [channel] = await db
    .select({ id: commChannels.id })
    .from(commChannels)
    .where(
      and(
        eq(commChannels.id, input.channelId),
        eq(commChannels.companyId, input.companyId),
        eq(commChannels.isDeleted, false),
        eq(commChannels.isArchived, false),
      ),
    )
    .limit(1);
  if (!channel) return false;

  const [member] = await db
    .select({ id: commChannelMembers.id })
    .from(commChannelMembers)
    .where(
      and(
        eq(commChannelMembers.channelId, input.channelId),
        eq(commChannelMembers.userId, input.userId),
      ),
    )
    .limit(1);
  return Boolean(member);
}

export async function canAccessChannelAccessRepo(input: {
  channelId: string;
  userId: string;
  companyId: string;
}): Promise<boolean> {
  const [channel] = await db
    .select({ id: commChannels.id, visibility: commChannels.visibility })
    .from(commChannels)
    .where(
      and(
        eq(commChannels.id, input.channelId),
        eq(commChannels.companyId, input.companyId),
        eq(commChannels.isDeleted, false),
        eq(commChannels.isArchived, false),
      ),
    )
    .limit(1);
  if (!channel) return false;

  if (channel.visibility === 'public') return true;
  return await isChannelMemberAccessRepo(input);
}

export async function canUserAccessCallContextAccessRepo(input: {
  companyId: string;
  userId: string;
  threadId?: string | null;
  channelId?: string | null;
}): Promise<boolean> {
  if (input.threadId) {
    return isThreadParticipantAccessRepo({
      threadId: input.threadId,
      userId: input.userId,
      companyId: input.companyId,
    });
  }

  if (input.channelId) {
    return canAccessChannelAccessRepo({
      channelId: input.channelId,
      userId: input.userId,
      companyId: input.companyId,
    });
  }

  return false;
}

export async function canUserAccessCallAccessRepo(input: {
  callId: string;
  companyId: string;
  userId: string;
}): Promise<boolean> {
  const [call] = await db
    .select({
      id: commCallSessions.id,
      threadId: commCallSessions.threadId,
      channelId: commCallSessions.channelId,
    })
    .from(commCallSessions)
    .where(
      and(eq(commCallSessions.id, input.callId), eq(commCallSessions.companyId, input.companyId)),
    )
    .limit(1);
  if (!call) return false;

  return canUserAccessCallContextAccessRepo({
    companyId: input.companyId,
    userId: input.userId,
    threadId: call.threadId,
    channelId: call.channelId,
  });
}

export async function listThreadParticipantUserIdsAccessRepo(input: {
  companyId: string;
  threadId: string;
}): Promise<string[]> {
  const rows = await db
    .select({ userId: commThreadParticipants.userId })
    .from(commThreadParticipants)
    .innerJoin(commThreads, eq(commThreads.id, commThreadParticipants.threadId))
    .where(
      and(
        eq(commThreadParticipants.threadId, input.threadId),
        eq(commThreadParticipants.isDeleted, false),
        isNull(commThreadParticipants.leftAt),
        eq(commThreads.companyId, input.companyId),
        eq(commThreads.isDeleted, false),
      ),
    );

  return rows.map((row) => row.userId);
}

export async function listChannelVisibleUserIdsAccessRepo(input: {
  companyId: string;
  channelId: string;
}): Promise<string[]> {
  const [channel] = await db
    .select({ id: commChannels.id, visibility: commChannels.visibility })
    .from(commChannels)
    .where(
      and(
        eq(commChannels.id, input.channelId),
        eq(commChannels.companyId, input.companyId),
        eq(commChannels.isDeleted, false),
        eq(commChannels.isArchived, false),
      ),
    )
    .limit(1);
  if (!channel) return [];

  if (channel.visibility === 'public') {
    const allUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.companyId, input.companyId));
    return allUsers.map((row) => row.id);
  }

  const memberRows = await db
    .select({ userId: commChannelMembers.userId })
    .from(commChannelMembers)
    .where(eq(commChannelMembers.channelId, input.channelId));
  return memberRows.map((row) => row.userId);
}
