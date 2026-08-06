import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { notificationTemplates } from '@/db/schemas';

export async function findSmsEventTemplateRepo(companyId: string, code: string) {
  const [row] = await db
    .select({
      id: notificationTemplates.id,
      body: notificationTemplates.body,
      isActive: notificationTemplates.isActive,
    })
    .from(notificationTemplates)
    .where(
      and(
        eq(notificationTemplates.companyId, companyId),
        eq(notificationTemplates.channel, 'sms'),
        sql`lower(${notificationTemplates.code}) = ${code.toLowerCase()}`,
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function upsertSmsEventTemplateRepo(input: {
  companyId: string;
  actorUserId: string;
  code: string;
  name: string;
  body: string;
  variables: string[];
}) {
  const existing = await findSmsEventTemplateRepo(input.companyId, input.code);
  if (existing) {
    const [updated] = await db
      .update(notificationTemplates)
      .set({
        name: input.name,
        body: input.body,
        variablesJson: input.variables,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(notificationTemplates.id, existing.id))
      .returning({ id: notificationTemplates.id });
    return updated ?? null;
  }

  const [created] = await db
    .insert(notificationTemplates)
    .values({
      companyId: input.companyId,
      channel: 'sms',
      code: input.code,
      name: input.name,
      body: input.body,
      variablesJson: input.variables,
      isActive: true,
      createdBy: input.actorUserId,
    })
    .returning({ id: notificationTemplates.id });
  return created ?? null;
}
