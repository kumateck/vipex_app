import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';
import { db } from '@/db/config';
import { commMessages, commThreadParticipants, commThreads } from '@/db/schemas';
import type {
  CommunicationMessagesCreateInput,
  CommunicationMessagesDeleteInput,
  CommunicationMeetingItem,
  CommunicationMeetingsListInput,
  CommunicationMessagesItem,
  CommunicationMessagesListInput,
  CommunicationMessagesToggleFlagInput,
  CommunicationMessagesUpdateInput,
} from './dto';

export async function isThreadParticipantRepo(input: {
  threadId: string;
  userId: string;
  companyId: string;
}) {
  const [row] = await db
    .select({ id: commThreadParticipants.id })
    .from(commThreadParticipants)
    .innerJoin(commThreads, eq(commThreads.id, commThreadParticipants.threadId))
    .where(
      and(
        eq(commThreadParticipants.threadId, input.threadId),
        eq(commThreadParticipants.userId, input.userId),
        eq(commThreadParticipants.isDeleted, false),
        eq(commThreads.companyId, input.companyId),
        eq(commThreads.isDeleted, false),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function listCommunicationMessagesRepo(
  input: CommunicationMessagesListInput,
): Promise<CommunicationMessagesItem[]> {
  const limit = input.limit ?? 100;
  const rows = await db
    .select({
      id: commMessages.id,
      threadId: commMessages.threadId,
      senderUserId: commMessages.senderUserId,
      messageType: commMessages.messageType,
      body: commMessages.body,
      metadataJson: commMessages.metadataJson,
      replyToMessageId: commMessages.replyToMessageId,
      editedAt: commMessages.editedAt,
      deletedAt: commMessages.deletedAt,
      createdAt: commMessages.createdAt,
    })
    .from(commMessages)
    .innerJoin(commThreads, eq(commThreads.id, commMessages.threadId))
    .where(
      and(
        eq(commMessages.threadId, input.threadId),
        eq(commThreads.companyId, input.companyId),
        eq(commMessages.isDeleted, false),
      ),
    )
    .orderBy(desc(commMessages.createdAt), desc(commMessages.id))
    .limit(limit);

  return rows
    .map((row) => ({
      ...row,
      editedAt: row.editedAt ? row.editedAt.toISOString() : null,
      deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    }))
    .reverse();
}

export async function listCommunicationMeetingsRepo(
  input: CommunicationMeetingsListInput,
): Promise<CommunicationMeetingItem[]> {
  const limit = input.limit ?? 200;
  const where = [
    eq(commThreads.companyId, input.companyId),
    eq(commThreads.isDeleted, false),
    eq(commMessages.isDeleted, false),
    eq(commMessages.messageType, 'meeting'),
    eq(commThreadParticipants.userId, input.userId),
    eq(commThreadParticipants.isDeleted, false),
  ];

  if (input.threadId?.trim()) {
    where.push(eq(commMessages.threadId, input.threadId.trim()));
  }

  if (input.from) {
    const parsed = new Date(input.from);
    if (!Number.isNaN(parsed.getTime())) {
      where.push(gte(commMessages.createdAt, parsed));
    }
  }
  if (input.to) {
    const parsed = new Date(input.to);
    if (!Number.isNaN(parsed.getTime())) {
      where.push(lte(commMessages.createdAt, parsed));
    }
  }

  const rows = await db
    .select({
      messageId: commMessages.id,
      threadId: commMessages.threadId,
      threadTitle: commThreads.title,
      threadType: commThreads.threadType,
      senderUserId: commMessages.senderUserId,
      body: commMessages.body,
      metadataJson: commMessages.metadataJson,
      createdAt: commMessages.createdAt,
    })
    .from(commMessages)
    .innerJoin(commThreads, eq(commThreads.id, commMessages.threadId))
    .innerJoin(commThreadParticipants, eq(commThreadParticipants.threadId, commMessages.threadId))
    .where(and(...where))
    .orderBy(asc(commMessages.createdAt), asc(commMessages.id))
    .limit(limit);

  return rows.map((row) => {
    const metadata =
      row.metadataJson && typeof row.metadataJson === 'object' && !Array.isArray(row.metadataJson)
        ? (row.metadataJson as Record<string, unknown>)
        : {};
    const title =
      typeof metadata.title === 'string' && metadata.title.trim()
        ? metadata.title.trim()
        : 'Meeting';
    const link =
      typeof metadata.link === 'string' && metadata.link.trim()
        ? metadata.link.trim()
        : typeof metadata.url === 'string' && metadata.url.trim()
          ? metadata.url.trim()
          : null;
    const startsAtRaw =
      typeof metadata.startsAt === 'string'
        ? metadata.startsAt
        : typeof metadata.startAt === 'string'
          ? metadata.startAt
          : null;

    return {
      ...row,
      title,
      link,
      startsAt: startsAtRaw,
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    };
  });
}

export async function getCommunicationMessageByIdRepo(input: {
  id: string;
  companyId: string;
}): Promise<CommunicationMessagesItem | null> {
  const [row] = await db
    .select({
      id: commMessages.id,
      threadId: commMessages.threadId,
      senderUserId: commMessages.senderUserId,
      messageType: commMessages.messageType,
      body: commMessages.body,
      metadataJson: commMessages.metadataJson,
      replyToMessageId: commMessages.replyToMessageId,
      editedAt: commMessages.editedAt,
      deletedAt: commMessages.deletedAt,
      createdAt: commMessages.createdAt,
    })
    .from(commMessages)
    .innerJoin(commThreads, eq(commThreads.id, commMessages.threadId))
    .where(
      and(
        eq(commMessages.id, input.id),
        eq(commThreads.companyId, input.companyId),
        eq(commThreads.isDeleted, false),
      ),
    )
    .limit(1);
  if (!row) return null;
  return {
    ...row,
    editedAt: row.editedAt ? row.editedAt.toISOString() : null,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
  };
}

export async function createCommunicationMessagesRepo(
  input: CommunicationMessagesCreateInput,
): Promise<CommunicationMessagesItem> {
  const [created] = await db
    .insert(commMessages)
    .values({
      threadId: input.threadId,
      senderUserId: input.userId,
      messageType: input.messageType ?? 'text',
      body: input.body ?? null,
      metadataJson: input.metadataJson ?? null,
      replyToMessageId: input.replyToMessageId ?? null,
    })
    .returning({
      id: commMessages.id,
      threadId: commMessages.threadId,
      senderUserId: commMessages.senderUserId,
      messageType: commMessages.messageType,
      body: commMessages.body,
      metadataJson: commMessages.metadataJson,
      replyToMessageId: commMessages.replyToMessageId,
      editedAt: commMessages.editedAt,
      deletedAt: commMessages.deletedAt,
      createdAt: commMessages.createdAt,
    });
  if (!created) throw new Error('Failed to create message');

  await db
    .update(commThreads)
    .set({ lastMessageAt: new Date() })
    .where(eq(commThreads.id, input.threadId));

  return {
    ...created,
    editedAt: created.editedAt ? created.editedAt.toISOString() : null,
    deletedAt: created.deletedAt ? created.deletedAt.toISOString() : null,
    createdAt: created.createdAt ? created.createdAt.toISOString() : null,
  };
}

export async function updateCommunicationMessageRepo(
  input: CommunicationMessagesUpdateInput,
): Promise<CommunicationMessagesItem> {
  const [updated] = await db
    .update(commMessages)
    .set({
      body: input.body ?? null,
      metadataJson: input.metadataJson ?? null,
      editedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(commMessages.id, input.id))
    .returning({
      id: commMessages.id,
      threadId: commMessages.threadId,
      senderUserId: commMessages.senderUserId,
      messageType: commMessages.messageType,
      body: commMessages.body,
      metadataJson: commMessages.metadataJson,
      replyToMessageId: commMessages.replyToMessageId,
      editedAt: commMessages.editedAt,
      deletedAt: commMessages.deletedAt,
      createdAt: commMessages.createdAt,
    });
  if (!updated) throw new Error('Message not found');
  return {
    ...updated,
    editedAt: updated.editedAt ? updated.editedAt.toISOString() : null,
    deletedAt: updated.deletedAt ? updated.deletedAt.toISOString() : null,
    createdAt: updated.createdAt ? updated.createdAt.toISOString() : null,
  };
}

export async function softDeleteCommunicationMessageRepo(
  input: CommunicationMessagesDeleteInput,
): Promise<CommunicationMessagesItem> {
  const [updated] = await db
    .update(commMessages)
    .set({
      body: null,
      metadataJson: null,
      isDeleted: true,
      deletedBy: input.userId,
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(commMessages.id, input.id))
    .returning({
      id: commMessages.id,
      threadId: commMessages.threadId,
      senderUserId: commMessages.senderUserId,
      messageType: commMessages.messageType,
      body: commMessages.body,
      metadataJson: commMessages.metadataJson,
      replyToMessageId: commMessages.replyToMessageId,
      editedAt: commMessages.editedAt,
      deletedAt: commMessages.deletedAt,
      createdAt: commMessages.createdAt,
    });
  if (!updated) throw new Error('Message not found');
  return {
    ...updated,
    editedAt: updated.editedAt ? updated.editedAt.toISOString() : null,
    deletedAt: updated.deletedAt ? updated.deletedAt.toISOString() : null,
    createdAt: updated.createdAt ? updated.createdAt.toISOString() : null,
  };
}

export async function toggleCommunicationMessageFlagRepo(
  input: CommunicationMessagesToggleFlagInput,
): Promise<CommunicationMessagesItem> {
  const existing = await getCommunicationMessageByIdRepo({
    id: input.id,
    companyId: input.companyId,
  });
  if (!existing) throw new Error('Message not found');

  const metadata = (
    existing.metadataJson &&
    typeof existing.metadataJson === 'object' &&
    !Array.isArray(existing.metadataJson)
      ? (existing.metadataJson as Record<string, unknown>)
      : {}
  ) as Record<string, unknown>;

  const current = Array.isArray(metadata[input.flag])
    ? (metadata[input.flag] as unknown[]).filter((item): item is string => typeof item === 'string')
    : [];

  const set = new Set(current);
  if (input.enabled) set.add(input.userId);
  else set.delete(input.userId);

  const nextMetadata: Record<string, unknown> = { ...metadata, [input.flag]: [...set] };

  return updateCommunicationMessageRepo({
    companyId: input.companyId,
    userId: input.userId,
    id: input.id,
    body: existing.body,
    metadataJson: nextMetadata,
  });
}
