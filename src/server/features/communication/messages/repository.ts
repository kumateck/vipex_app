import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { commMessages, commThreadParticipants, commThreads } from '@/db/schemas';
import type {
  CommunicationMessagesCreateInput,
  CommunicationMessagesItem,
  CommunicationMessagesListInput,
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
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    }))
    .reverse();
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
    })
    .returning({
      id: commMessages.id,
      threadId: commMessages.threadId,
      senderUserId: commMessages.senderUserId,
      messageType: commMessages.messageType,
      body: commMessages.body,
      metadataJson: commMessages.metadataJson,
      createdAt: commMessages.createdAt,
    });
  if (!created) throw new Error('Failed to create message');

  await db
    .update(commThreads)
    .set({ lastMessageAt: new Date() })
    .where(eq(commThreads.id, input.threadId));

  return { ...created, createdAt: created.createdAt ? created.createdAt.toISOString() : null };
}
