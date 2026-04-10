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

  const directThreadIds = rows.filter((row) => row.threadType === 'direct').map((row) => row.id);
  let directPeerByThreadId = new Map<string, string>();
  if (directThreadIds.length) {
    const directPeers = await db
      .select({
        threadId: commThreadParticipants.threadId,
        userId: commThreadParticipants.userId,
      })
      .from(commThreadParticipants)
      .where(
        and(
          inArray(commThreadParticipants.threadId, directThreadIds),
          eq(commThreadParticipants.isDeleted, false),
          isNull(commThreadParticipants.leftAt),
        ),
      );

    directPeerByThreadId = new Map(
      directPeers
        .filter((row) => row.userId !== input.userId)
        .map((row) => [row.threadId, row.userId]),
    );
  }

  return rows.map((row) => ({
    ...row,
    lastMessageAt: row.lastMessageAt ? row.lastMessageAt.toISOString() : null,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    participantCount: countMap.get(row.id) ?? 0,
    directPeerUserId:
      row.threadType === 'direct' ? (directPeerByThreadId.get(row.id) ?? null) : null,
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

export async function findExistingDirectThreadRepo(input: {
  companyId: string;
  participantUserIds: [string, string];
}): Promise<{ id: string } | null> {
  const [userA, userB] = input.participantUserIds;
  const rows = await db
    .select({
      threadId: commThreadParticipants.threadId,
      userId: commThreadParticipants.userId,
    })
    .from(commThreadParticipants)
    .innerJoin(commThreads, eq(commThreads.id, commThreadParticipants.threadId))
    .where(
      and(
        eq(commThreads.companyId, input.companyId),
        eq(commThreads.threadType, 'direct'),
        eq(commThreads.isDeleted, false),
        eq(commThreadParticipants.isDeleted, false),
        isNull(commThreadParticipants.leftAt),
        inArray(commThreadParticipants.userId, [userA, userB]),
      ),
    );

  const usersByThread = new Map<string, Set<string>>();
  for (const row of rows) {
    const bucket = usersByThread.get(row.threadId) ?? new Set<string>();
    bucket.add(row.userId);
    usersByThread.set(row.threadId, bucket);
  }

  for (const [threadId, userIds] of usersByThread.entries()) {
    if (userIds.has(userA) && userIds.has(userB)) {
      return { id: threadId };
    }
  }

  return null;
}
