import { and, count, desc, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { companies, websiteContactEvents, websiteContactMessages } from '@/db/schemas';
import { Conflict, NotFound } from '@/server/utils/http-error';
import type { ContactListInput, ContactRecord, ContactUpdateInput } from './schema';

export async function isWebsiteContactEnabledRepo(companyId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(and(eq(companies.id, companyId), eq(companies.isDeleted, false)))
    .limit(1);
  return Boolean(row);
}

export async function saveWebsiteContactRepo(message: ContactRecord): Promise<void> {
  await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(websiteContactMessages)
      .values(message)
      .onConflictDoNothing({ target: websiteContactMessages.id })
      .returning({ id: websiteContactMessages.id });
    if (!created) {
      const [existing] = await tx
        .select()
        .from(websiteContactMessages)
        .where(
          and(
            eq(websiteContactMessages.id, message.id),
            eq(websiteContactMessages.companyId, message.companyId),
          ),
        )
        .limit(1);
      const fields = Object.keys(message) as Array<keyof ContactRecord>;
      if (!existing || fields.some((field) => existing[field] !== message[field])) {
        throw Conflict('This submission reference has already been used for another message');
      }
      return;
    }
    await tx.insert(websiteContactEvents).values({
      messageId: created.id,
      companyId: message.companyId,
      toStatus: 'new',
      note: 'Message received from the public website',
    });
  });
}

export async function listWebsiteContactsRepo(input: ContactListInput) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where = and(
    eq(websiteContactMessages.companyId, input.companyId),
    input.status ? eq(websiteContactMessages.status, input.status) : undefined,
    input.type ? eq(websiteContactMessages.type, input.type) : undefined,
  );
  const [items, totals] = await Promise.all([
    db
      .select()
      .from(websiteContactMessages)
      .where(where)
      .orderBy(desc(websiteContactMessages.createdAt), desc(websiteContactMessages.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(websiteContactMessages).where(where),
  ]);
  return { items, total: totals[0]?.total ?? 0, page, pageSize };
}

export async function getWebsiteContactRepo(companyId: string, id: string) {
  const [message] = await db
    .select()
    .from(websiteContactMessages)
    .where(and(eq(websiteContactMessages.companyId, companyId), eq(websiteContactMessages.id, id)))
    .limit(1);
  if (!message) throw NotFound('Customer message not found');
  const events = await db
    .select()
    .from(websiteContactEvents)
    .where(
      and(eq(websiteContactEvents.companyId, companyId), eq(websiteContactEvents.messageId, id)),
    )
    .orderBy(desc(websiteContactEvents.createdAt), desc(websiteContactEvents.id));
  return { ...message, events };
}

export async function updateWebsiteContactRepo(input: ContactUpdateInput) {
  return db.transaction(async (tx) => {
    const where = and(
      eq(websiteContactMessages.companyId, input.companyId),
      eq(websiteContactMessages.id, input.id),
    );
    const [current] = await tx.select().from(websiteContactMessages).where(where).for('update');
    if (!current) throw NotFound('Customer message not found');
    if (current.updatedAt.getTime() !== new Date(input.updatedAt).getTime()) {
      throw Conflict('This message changed. Refresh before saving again.');
    }
    const updatedAt = new Date(Math.max(Date.now(), current.updatedAt.getTime() + 1));
    const [updated] = await tx
      .update(websiteContactMessages)
      .set({
        status: input.status,
        updatedAt,
        updatedBy: input.userId,
      })
      .where(where)
      .returning();
    await tx.insert(websiteContactEvents).values({
      messageId: input.id,
      companyId: input.companyId,
      fromStatus: current.status,
      toStatus: input.status,
      note: input.note?.trim() || null,
      performedBy: input.userId,
    });
    return updated;
  });
}
