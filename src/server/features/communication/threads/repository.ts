import { and, asc, count, desc, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/db/config';
import { commThreadParticipants, commThreads } from '@/db/schemas';
import type {
  CommunicationThreadsCreateInput,
  CommunicationThreadsItem,
  CommunicationThreadsListInput,
} from './dto';

export async function listCommunicationThreadsRepo(
  input: CommunicationThreadsListInput,
): Promise<CommunicationThreadsItem[]> {
  const where = [
    eq(commThreads.companyId, input.companyId),
    eq(commThreadParticipants.userId, input.userId),
    eq(commThreads.isDeleted, false),
  ];
  if (input.threadType) {
    where.push(eq(commThreads.threadType, input.threadType));
  }

  const rows = await db
    .select({
      id: commThreads.id,
      companyId: commThreads.companyId,
      branchId: commThreads.branchId,
      locationId: commThreads.locationId,
      threadType: commThreads.threadType,
      title: commThreads.title,
      isPrivate: commThreads.isPrivate,
      lastMessageAt: commThreads.lastMessageAt,
      createdAt: commThreads.createdAt,
    })
    .from(commThreads)
    .innerJoin(commThreadParticipants, eq(commThreadParticipants.threadId, commThreads.id))
    .where(and(...where))
    .orderBy(desc(commThreads.lastMessageAt), desc(commThreads.createdAt), asc(commThreads.id));

  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const counts = await db
    .select({
      threadId: commThreadParticipants.threadId,
      c: count(),
    })
    .from(commThreadParticipants)
    .where(
      and(
        inArray(commThreadParticipants.threadId, ids),
        isNull(commThreadParticipants.leftAt),
        eq(commThreadParticipants.isDeleted, false),
      ),
    )
    .groupBy(commThreadParticipants.threadId);
  const countMap = new Map(counts.map((row) => [row.threadId, Number(row.c)]));

  return rows.map((row) => ({
    ...row,
    lastMessageAt: row.lastMessageAt ? row.lastMessageAt.toISOString() : null,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    participantCount: countMap.get(row.id) ?? 0,
  }));
}

export async function createCommunicationThreadRepo(
  input: CommunicationThreadsCreateInput,
): Promise<{ id: string }> {
  const [created] = await db
    .insert(commThreads)
    .values({
      companyId: input.companyId,
      branchId: input.branchId ?? null,
      locationId: input.locationId ?? null,
      threadType: input.threadType,
      title: input.title ?? null,
      isPrivate: input.threadType !== 'channel',
      createdBy: input.userId,
    })
    .returning({ id: commThreads.id });
  if (!created) throw new Error('Failed to create thread');

  const participants = input.participantUserIds.map((userId) => ({
    threadId: created.id,
    userId,
    roleInThread: userId === input.userId ? 'owner' : 'member',
  }));
  if (participants.length) {
    await db.insert(commThreadParticipants).values(participants);
  }

  return created;
}
