import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { notificationDispatches, notificationProviders, notificationTemplates } from '@/db/schemas';
import { WHATSAPP_PROVIDER_KEY } from '../notification-hub/providers';

const CHANNEL = 'whatsapp';

const providerColumns = {
  id: notificationProviders.id,
  companyId: notificationProviders.companyId,
  channel: notificationProviders.channel,
  providerKey: notificationProviders.providerKey,
  name: notificationProviders.name,
  configJson: notificationProviders.configJson,
  isActive: notificationProviders.isActive,
  isDefault: notificationProviders.isDefault,
  updatedAt: notificationProviders.updatedAt,
};

export async function findWhatsAppProviderRepo(companyId: string) {
  const [row] = await db
    .select(providerColumns)
    .from(notificationProviders)
    .where(
      and(
        eq(notificationProviders.companyId, companyId),
        eq(notificationProviders.channel, CHANNEL),
        sql`lower(${notificationProviders.providerKey}) = ${WHATSAPP_PROVIDER_KEY}`,
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function findWhatsAppProviderByPhoneNumberIdRepo(phoneNumberId: string) {
  const [row] = await db
    .select(providerColumns)
    .from(notificationProviders)
    .where(
      and(
        eq(notificationProviders.channel, CHANNEL),
        sql`${notificationProviders.configJson} ->> 'phoneNumberId' = ${phoneNumberId}`,
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function findWhatsAppProviderByVerifyTokenRepo(token: string) {
  const [row] = await db
    .select({ id: notificationProviders.id })
    .from(notificationProviders)
    .where(
      and(
        eq(notificationProviders.channel, CHANNEL),
        sql`${notificationProviders.configJson} ->> 'webhookVerifyToken' = ${token}`,
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listWhatsAppTemplateOverridesRepo(companyId: string) {
  return db
    .select({
      code: notificationTemplates.code,
      templateName: notificationTemplates.body,
      language: notificationTemplates.subject,
      isActive: notificationTemplates.isActive,
    })
    .from(notificationTemplates)
    .where(
      and(
        eq(notificationTemplates.companyId, companyId),
        eq(notificationTemplates.channel, CHANNEL),
      ),
    );
}

export async function upsertWhatsAppTemplateOverrideRepo(input: {
  companyId: string;
  actorUserId: string;
  code: string;
  name: string;
  templateName: string;
  language: string;
  variables: string[];
}) {
  const [existing] = await db
    .select({ id: notificationTemplates.id })
    .from(notificationTemplates)
    .where(
      and(
        eq(notificationTemplates.companyId, input.companyId),
        eq(notificationTemplates.channel, CHANNEL),
        sql`lower(${notificationTemplates.code}) = ${input.code.toLowerCase()}`,
      ),
    )
    .limit(1);

  const values = {
    name: input.name,
    body: input.templateName,
    subject: input.language,
    variablesJson: input.variables,
    isActive: true,
  };
  if (existing) {
    const [updated] = await db
      .update(notificationTemplates)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(notificationTemplates.id, existing.id))
      .returning({ id: notificationTemplates.id });
    return updated ?? null;
  }
  const [created] = await db
    .insert(notificationTemplates)
    .values({
      ...values,
      companyId: input.companyId,
      channel: CHANNEL,
      code: input.code,
      createdBy: input.actorUserId,
    })
    .returning({ id: notificationTemplates.id });
  return created ?? null;
}

export async function findWhatsAppDispatchByMessageIdRepo(providerMessageId: string) {
  const [row] = await db
    .select({
      id: notificationDispatches.id,
      companyId: notificationDispatches.companyId,
      status: notificationDispatches.status,
    })
    .from(notificationDispatches)
    .where(
      and(
        eq(notificationDispatches.providerMessageId, providerMessageId),
        eq(notificationDispatches.channel, CHANNEL),
      ),
    )
    .limit(1);
  return row ?? null;
}
