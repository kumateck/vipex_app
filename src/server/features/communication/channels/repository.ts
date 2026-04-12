import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  commCallSessions,
  commChannelMembers,
  commChannelReadState,
  commChannels,
  commMessages,
  commThreadParticipants,
  commThreads,
  users,
} from '@/db/schemas';
import type {
  CommunicationChannelsCreateInput,
  CommunicationChannelsGetByIdInput,
  CommunicationChannelsItem,
  CommunicationChannelsListInput,
  CommunicationChannelsMarkReadInput,
  CommunicationChannelsParticipantsInput,
  CommunicationChannelsRemoveParticipantInput,
  CommunicationChannelsUnreadCountItem,
  CommunicationChannelsUnreadCountsInput,
  CommunicationChannelsUpdateInput,
} from './dto';

type ChannelRow = {
  id: string;
  companyId: string;
  branchId: string | null;
  locationId: string | null;
  name: string;
  description: string | null;
  channelType: string;
  visibility: string;
  isCallEnabled: boolean;
  isAnnouncementOnly: boolean;
  threadId: string | null;
  maxParticipants: number | null;
  isArchived: boolean;
  archivedAt: Date | null;
  createdBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

function toChannelItem(
  row: ChannelRow,
  participantCount: number,
  participantUserIds?: string[],
): CommunicationChannelsItem {
  return {
    ...row,
    archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
    participantCount,
    participantUserIds,
  };
}

async function listCompanyUserIds(companyId: string): Promise<string[]> {
  const rows = await db.select({ id: users.id }).from(users).where(eq(users.companyId, companyId));
  return rows.map((row) => row.id);
}

export async function listValidCompanyUserIdsRepo(input: {
  companyId: string;
  userIds: string[];
}): Promise<string[]> {
  const normalized = [...new Set(input.userIds.map((id) => id.trim()).filter(Boolean))];
  if (!normalized.length) return [];

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.companyId, input.companyId), inArray(users.id, normalized)));
  return rows.map((row) => row.id);
}

export async function getCommunicationChannelByIdRepo(
  input: CommunicationChannelsGetByIdInput,
): Promise<CommunicationChannelsItem | null> {
  const [row] = await db
    .select({
      id: commChannels.id,
      companyId: commChannels.companyId,
      branchId: commChannels.branchId,
      locationId: commChannels.locationId,
      name: commChannels.name,
      description: commChannels.description,
      channelType: commChannels.channelType,
      visibility: commChannels.visibility,
      isCallEnabled: commChannels.isCallEnabled,
      isAnnouncementOnly: commChannels.isAnnouncementOnly,
      threadId: commChannels.threadId,
      maxParticipants: commChannels.maxParticipants,
      isArchived: commChannels.isArchived,
      archivedAt: commChannels.archivedAt,
      createdBy: commChannels.createdBy,
      createdAt: commChannels.createdAt,
      updatedAt: commChannels.updatedAt,
    })
    .from(commChannels)
    .where(
      and(
        eq(commChannels.id, input.id),
        eq(commChannels.companyId, input.companyId),
        eq(commChannels.isDeleted, false),
      ),
    )
    .limit(1);
  if (!row) return null;

  const members = await db
    .select({ userId: commChannelMembers.userId })
    .from(commChannelMembers)
    .where(eq(commChannelMembers.channelId, row.id));

  const isVisible =
    row.visibility === 'public' || members.some((member) => member.userId === input.userId);
  if (!isVisible) return null;

  const participantCount =
    row.visibility === 'public'
      ? (await listCompanyUserIds(input.companyId)).length
      : members.length;
  return toChannelItem(
    row,
    participantCount,
    members.map((member) => member.userId),
  );
}

export async function listCommunicationChannelsRepo(
  input: CommunicationChannelsListInput,
): Promise<CommunicationChannelsItem[]> {
  const where = [eq(commChannels.companyId, input.companyId), eq(commChannels.isDeleted, false)];
  if (!input.includeArchived) {
    where.push(eq(commChannels.isArchived, false));
  }
  if (input.channelType) {
    where.push(eq(commChannels.channelType, input.channelType));
  }

  const rows = await db
    .select({
      id: commChannels.id,
      companyId: commChannels.companyId,
      branchId: commChannels.branchId,
      locationId: commChannels.locationId,
      name: commChannels.name,
      description: commChannels.description,
      channelType: commChannels.channelType,
      visibility: commChannels.visibility,
      isCallEnabled: commChannels.isCallEnabled,
      isAnnouncementOnly: commChannels.isAnnouncementOnly,
      threadId: commChannels.threadId,
      maxParticipants: commChannels.maxParticipants,
      isArchived: commChannels.isArchived,
      archivedAt: commChannels.archivedAt,
      createdBy: commChannels.createdBy,
      createdAt: commChannels.createdAt,
      updatedAt: commChannels.updatedAt,
    })
    .from(commChannels)
    .where(and(...where))
    .orderBy(desc(commChannels.createdAt), desc(commChannels.id));

  if (!rows.length) return [];

  const memberRows = await db
    .select({ channelId: commChannelMembers.channelId, userId: commChannelMembers.userId })
    .from(commChannelMembers)
    .where(
      inArray(
        commChannelMembers.channelId,
        rows.map((row) => row.id),
      ),
    );

  const membersByChannelId = new Map<string, Set<string>>();
  for (const member of memberRows) {
    const set = membersByChannelId.get(member.channelId) ?? new Set<string>();
    set.add(member.userId);
    membersByChannelId.set(member.channelId, set);
  }

  const companyUserIds = await listCompanyUserIds(input.companyId);
  const companyUserCount = companyUserIds.length;

  return rows
    .filter((row) => {
      if (row.visibility === 'public') return true;
      const members = membersByChannelId.get(row.id);
      return Boolean(members?.has(input.userId));
    })
    .map((row) =>
      toChannelItem(
        row,
        row.visibility === 'public'
          ? companyUserCount
          : (membersByChannelId.get(row.id)?.size ?? 0),
        row.visibility === 'public' ? companyUserIds : [...(membersByChannelId.get(row.id) ?? [])],
      ),
    );
}

async function createThreadForChannelTx(params: {
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0];
  input: CommunicationChannelsCreateInput;
  participantUserIds: string[];
}): Promise<string> {
  const [createdThread] = await params.tx
    .insert(commThreads)
    .values({
      companyId: params.input.companyId,
      branchId: params.input.branchId ?? null,
      locationId: params.input.locationId ?? null,
      threadType: 'channel',
      title: params.input.name,
      isPrivate: params.input.visibility === 'private',
      createdBy: params.input.userId,
    })
    .returning({ id: commThreads.id });
  if (!createdThread) throw new Error('Failed to create channel thread');

  const participants = params.participantUserIds.map((userId) => ({
    threadId: createdThread.id,
    userId,
    roleInThread: userId === params.input.userId ? 'owner' : 'member',
  }));
  if (participants.length) {
    await params.tx.insert(commThreadParticipants).values(participants);
  }

  return createdThread.id;
}

export async function createCommunicationChannelsRepo(
  input: CommunicationChannelsCreateInput,
): Promise<CommunicationChannelsItem> {
  return db.transaction(async (tx) => {
    const companyUserIds =
      input.visibility === 'public'
        ? await listCompanyUserIds(input.companyId)
        : await listValidCompanyUserIdsRepo({
            companyId: input.companyId,
            userIds: input.participantUserIds ?? [],
          });

    const participants = [...new Set([input.userId, ...companyUserIds])];

    const threadId = await createThreadForChannelTx({
      tx,
      input,
      participantUserIds: participants,
    });

    const [created] = await tx
      .insert(commChannels)
      .values({
        companyId: input.companyId,
        branchId: input.branchId ?? null,
        locationId: input.locationId ?? null,
        name: input.name,
        description: input.description ?? null,
        channelType: input.channelType,
        visibility: input.visibility,
        isCallEnabled: Boolean(input.isCallEnabled),
        isAnnouncementOnly: Boolean(input.isAnnouncementOnly),
        threadId,
        maxParticipants: input.maxParticipants ?? null,
        createdBy: input.userId,
      })
      .returning({
        id: commChannels.id,
        companyId: commChannels.companyId,
        branchId: commChannels.branchId,
        locationId: commChannels.locationId,
        name: commChannels.name,
        description: commChannels.description,
        channelType: commChannels.channelType,
        visibility: commChannels.visibility,
        isCallEnabled: commChannels.isCallEnabled,
        isAnnouncementOnly: commChannels.isAnnouncementOnly,
        threadId: commChannels.threadId,
        maxParticipants: commChannels.maxParticipants,
        isArchived: commChannels.isArchived,
        archivedAt: commChannels.archivedAt,
        createdBy: commChannels.createdBy,
        createdAt: commChannels.createdAt,
        updatedAt: commChannels.updatedAt,
      });
    if (!created) throw new Error('Failed to create channel');

    if (input.visibility === 'private') {
      const memberRows = participants.map((participantUserId) => ({
        channelId: created.id,
        userId: participantUserId,
        memberRole: participantUserId === input.userId ? 'owner' : 'member',
      }));
      if (memberRows.length) {
        await tx.insert(commChannelMembers).values(memberRows);
      }
    }

    return toChannelItem(created, participants.length, participants);
  });
}

export async function ensureCommunicationChannelThreadRepo(input: {
  companyId: string;
  channelId: string;
  userId: string;
}): Promise<string | null> {
  return db.transaction(async (tx) => {
    const [channel] = await tx
      .select({
        id: commChannels.id,
        companyId: commChannels.companyId,
        name: commChannels.name,
        visibility: commChannels.visibility,
        threadId: commChannels.threadId,
        createdBy: commChannels.createdBy,
      })
      .from(commChannels)
      .where(
        and(
          eq(commChannels.id, input.channelId),
          eq(commChannels.companyId, input.companyId),
          eq(commChannels.isDeleted, false),
        ),
      )
      .limit(1);

    if (!channel) return null;
    if (channel.threadId) return channel.threadId;

    const participantUserIds =
      channel.visibility === 'public'
        ? await listCompanyUserIds(input.companyId)
        : (
            await tx
              .select({ userId: commChannelMembers.userId })
              .from(commChannelMembers)
              .where(eq(commChannelMembers.channelId, input.channelId))
          ).map((row) => row.userId);

    const uniqueParticipants = [...new Set([input.userId, ...participantUserIds])];

    const [createdThread] = await tx
      .insert(commThreads)
      .values({
        companyId: input.companyId,
        threadType: 'channel',
        title: channel.name,
        isPrivate: channel.visibility === 'private',
        createdBy: channel.createdBy ?? input.userId,
      })
      .returning({ id: commThreads.id });
    if (!createdThread) return null;

    if (uniqueParticipants.length) {
      await tx.insert(commThreadParticipants).values(
        uniqueParticipants.map((userId) => ({
          threadId: createdThread.id,
          userId,
          roleInThread: userId === (channel.createdBy ?? input.userId) ? 'owner' : 'member',
        })),
      );
    }

    await tx
      .update(commChannels)
      .set({ threadId: createdThread.id, updatedAt: new Date() })
      .where(eq(commChannels.id, channel.id));

    return createdThread.id;
  });
}

export async function updateCommunicationChannelsRepo(
  input: CommunicationChannelsUpdateInput,
): Promise<CommunicationChannelsItem | null> {
  const now = new Date();
  const [updated] = await db
    .update(commChannels)
    .set({
      name: input.name === undefined ? undefined : input.name,
      description: input.description === undefined ? undefined : (input.description ?? null),
      isArchived: input.isArchived ?? undefined,
      archivedAt: input.isArchived === undefined ? undefined : input.isArchived ? now : null,
      isCallEnabled: input.isCallEnabled ?? undefined,
      isAnnouncementOnly: input.isAnnouncementOnly ?? undefined,
      maxParticipants: input.maxParticipants === undefined ? undefined : input.maxParticipants,
      updatedAt: now,
    })
    .where(
      and(
        eq(commChannels.id, input.id),
        eq(commChannels.companyId, input.companyId),
        eq(commChannels.isDeleted, false),
      ),
    )
    .returning({
      id: commChannels.id,
      companyId: commChannels.companyId,
      branchId: commChannels.branchId,
      locationId: commChannels.locationId,
      name: commChannels.name,
      description: commChannels.description,
      channelType: commChannels.channelType,
      visibility: commChannels.visibility,
      isCallEnabled: commChannels.isCallEnabled,
      isAnnouncementOnly: commChannels.isAnnouncementOnly,
      threadId: commChannels.threadId,
      maxParticipants: commChannels.maxParticipants,
      isArchived: commChannels.isArchived,
      archivedAt: commChannels.archivedAt,
      createdBy: commChannels.createdBy,
      createdAt: commChannels.createdAt,
      updatedAt: commChannels.updatedAt,
    });
  if (!updated) return null;

  const members = await db
    .select({ userId: commChannelMembers.userId })
    .from(commChannelMembers)
    .where(eq(commChannelMembers.channelId, updated.id));
  const participantCount =
    updated.visibility === 'public'
      ? (await listCompanyUserIds(updated.companyId)).length
      : members.length;
  return toChannelItem(
    updated,
    participantCount,
    members.map((member) => member.userId),
  );
}

export async function addCommunicationChannelParticipantsRepo(
  input: CommunicationChannelsParticipantsInput,
): Promise<CommunicationChannelsItem | null> {
  const validUsers = await listValidCompanyUserIdsRepo({
    companyId: input.companyId,
    userIds: input.participantUserIds,
  });
  if (!validUsers.length) {
    return getCommunicationChannelByIdRepo({
      companyId: input.companyId,
      userId: input.userId,
      id: input.id,
    });
  }

  await db.transaction(async (tx) => {
    const rows = validUsers.map((participantUserId) => ({
      channelId: input.id,
      userId: participantUserId,
      memberRole: participantUserId === input.userId ? 'owner' : 'member',
    }));
    await tx
      .insert(commChannelMembers)
      .values(rows)
      .onConflictDoNothing({ target: [commChannelMembers.channelId, commChannelMembers.userId] });

    const [channel] = await tx
      .select({ threadId: commChannels.threadId, channelType: commChannels.channelType })
      .from(commChannels)
      .where(and(eq(commChannels.id, input.id), eq(commChannels.companyId, input.companyId)))
      .limit(1);
    if (!channel?.threadId || channel.channelType !== 'text') return;

    const threadRows = validUsers.map((participantUserId) => ({
      threadId: channel.threadId as string,
      userId: participantUserId,
      roleInThread: participantUserId === input.userId ? 'owner' : 'member',
      isDeleted: false,
      leftAt: null,
    }));
    await tx
      .insert(commThreadParticipants)
      .values(threadRows)
      .onConflictDoUpdate({
        target: [commThreadParticipants.threadId, commThreadParticipants.userId],
        set: {
          isDeleted: false,
          leftAt: null,
          updatedAt: new Date(),
        },
      });
  });

  return getCommunicationChannelByIdRepo({
    companyId: input.companyId,
    userId: input.userId,
    id: input.id,
  });
}

function hasMentionForUser(metadataJson: unknown, userId: string): boolean {
  if (!metadataJson || typeof metadataJson !== 'object' || Array.isArray(metadataJson))
    return false;
  const metadata = metadataJson as Record<string, unknown>;
  if (metadata.mentionAll === true) return true;
  const mentioned = metadata.mentionedUserIds;
  if (!Array.isArray(mentioned)) return false;
  return mentioned.some((item) => typeof item === 'string' && item === userId);
}

export async function listCommunicationChannelUnreadCountsRepo(
  input: CommunicationChannelsUnreadCountsInput,
): Promise<CommunicationChannelsUnreadCountItem[]> {
  const channels = await listCommunicationChannelsRepo({
    companyId: input.companyId,
    userId: input.userId,
    channelType: input.channelType,
    includeArchived: false,
  });
  if (!channels.length) return [];

  const channelIds = channels.map((channel) => channel.id);
  const lastReadRows = await db
    .select({
      channelId: commChannelReadState.channelId,
      lastReadAt: commChannelReadState.lastReadAt,
    })
    .from(commChannelReadState)
    .where(
      and(
        eq(commChannelReadState.userId, input.userId),
        inArray(commChannelReadState.channelId, channelIds),
      ),
    );

  const lastReadByChannelId = new Map<string, Date>(
    lastReadRows
      .filter((row) => row.lastReadAt instanceof Date)
      .map((row) => [row.channelId, row.lastReadAt as Date]),
  );

  const unreadByChannelId = new Map<string, number>();
  const mentionsByChannelId = new Map<string, number>();
  const latestActivityAtByChannelId = new Map<string, Date>();
  for (const channel of channels) {
    unreadByChannelId.set(channel.id, 0);
    mentionsByChannelId.set(channel.id, 0);
  }

  const textChannels = channels.filter((channel) => channel.threadId);
  const threadIdToChannelId = new Map<string, string>(
    textChannels
      .filter((channel): channel is CommunicationChannelsItem & { threadId: string } =>
        Boolean(channel.threadId),
      )
      .map((channel) => [channel.threadId, channel.id]),
  );

  const threadIds = [...threadIdToChannelId.keys()];
  if (threadIds.length) {
    const messageRows = await db
      .select({
        threadId: commMessages.threadId,
        senderUserId: commMessages.senderUserId,
        createdAt: commMessages.createdAt,
        metadataJson: commMessages.metadataJson,
      })
      .from(commMessages)
      .innerJoin(commThreads, eq(commThreads.id, commMessages.threadId))
      .where(
        and(
          inArray(commMessages.threadId, threadIds),
          eq(commThreads.companyId, input.companyId),
          eq(commThreads.isDeleted, false),
          eq(commMessages.isDeleted, false),
        ),
      );

    for (const row of messageRows) {
      if (!(row.createdAt instanceof Date)) continue;
      const channelId = threadIdToChannelId.get(row.threadId);
      if (!channelId) continue;

      const prevLatest = latestActivityAtByChannelId.get(channelId);
      if (!prevLatest || row.createdAt.getTime() > prevLatest.getTime()) {
        latestActivityAtByChannelId.set(channelId, row.createdAt);
      }

      if (row.senderUserId === input.userId) continue;
      const lastReadAt = lastReadByChannelId.get(channelId);
      if (!lastReadAt || row.createdAt.getTime() > lastReadAt.getTime()) {
        unreadByChannelId.set(channelId, (unreadByChannelId.get(channelId) ?? 0) + 1);
        if (hasMentionForUser(row.metadataJson, input.userId)) {
          mentionsByChannelId.set(channelId, (mentionsByChannelId.get(channelId) ?? 0) + 1);
        }
      }
    }
  }

  const voiceChannelIds = channels
    .filter((channel) => channel.channelType === 'voice')
    .map((channel) => channel.id);
  if (voiceChannelIds.length) {
    const callRows = await db
      .select({
        channelId: commCallSessions.channelId,
        initiatorUserId: commCallSessions.initiatorUserId,
        status: commCallSessions.status,
        createdAt: commCallSessions.createdAt,
        updatedAt: commCallSessions.updatedAt,
      })
      .from(commCallSessions)
      .where(
        and(
          eq(commCallSessions.companyId, input.companyId),
          inArray(commCallSessions.channelId, voiceChannelIds),
        ),
      );

    for (const row of callRows) {
      if (!row.channelId) continue;
      const activityAt = row.updatedAt ?? row.createdAt;
      if (!(activityAt instanceof Date)) continue;

      const prevLatest = latestActivityAtByChannelId.get(row.channelId);
      if (!prevLatest || activityAt.getTime() > prevLatest.getTime()) {
        latestActivityAtByChannelId.set(row.channelId, activityAt);
      }

      if (row.initiatorUserId === input.userId) continue;
      const lastReadAt = lastReadByChannelId.get(row.channelId);
      if (lastReadAt && activityAt.getTime() <= lastReadAt.getTime()) continue;

      unreadByChannelId.set(row.channelId, (unreadByChannelId.get(row.channelId) ?? 0) + 1);
      if (row.status === 'ringing') {
        // Keep voice mention signal high-intent: at most one ringing mention per channel.
        mentionsByChannelId.set(row.channelId, 1);
      }
    }
  }

  return channels.map((channel) => ({
    channelId: channel.id,
    unreadCount: unreadByChannelId.get(channel.id) ?? 0,
    mentionCount: mentionsByChannelId.get(channel.id) ?? 0,
    lastReadAt: lastReadByChannelId.get(channel.id)?.toISOString() ?? null,
    latestActivityAt: latestActivityAtByChannelId.get(channel.id)?.toISOString() ?? null,
  }));
}

export async function markCommunicationChannelReadRepo(
  input: CommunicationChannelsMarkReadInput,
): Promise<{ channelId: string; readAt: string | null }> {
  const now = new Date();
  const [updated] = await db
    .insert(commChannelReadState)
    .values({
      channelId: input.id,
      userId: input.userId,
      lastReadAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [commChannelReadState.channelId, commChannelReadState.userId],
      set: {
        lastReadAt: now,
        updatedAt: now,
      },
    })
    .returning({
      lastReadAt: commChannelReadState.lastReadAt,
    });

  return {
    channelId: input.id,
    readAt: updated?.lastReadAt?.toISOString() ?? now.toISOString(),
  };
}

export async function removeCommunicationChannelParticipantRepo(
  input: CommunicationChannelsRemoveParticipantInput,
): Promise<CommunicationChannelsItem | null> {
  await db.transaction(async (tx) => {
    await tx
      .delete(commChannelMembers)
      .where(
        and(
          eq(commChannelMembers.channelId, input.id),
          eq(commChannelMembers.userId, input.participantUserId),
        ),
      );

    const [channel] = await tx
      .select({ threadId: commChannels.threadId, channelType: commChannels.channelType })
      .from(commChannels)
      .where(and(eq(commChannels.id, input.id), eq(commChannels.companyId, input.companyId)))
      .limit(1);
    if (!channel?.threadId || channel.channelType !== 'text') return;

    await tx
      .update(commThreadParticipants)
      .set({ isDeleted: true, leftAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(commThreadParticipants.threadId, channel.threadId),
          eq(commThreadParticipants.userId, input.participantUserId),
        ),
      );
  });

  return getCommunicationChannelByIdRepo({
    companyId: input.companyId,
    userId: input.userId,
    id: input.id,
  });
}
