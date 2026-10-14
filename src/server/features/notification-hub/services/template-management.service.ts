import { Conflict, NotFound } from '@/server/utils/http-error';
import { recordAuditLog } from '../../audit/logger';
import { notificationTemplates } from '@/db/schemas';
import {
  createNotificationTemplateRepo,
  getNotificationTemplateByIdRepo,
  listNotificationTemplateOptionsRepo,
  listNotificationTemplatesRepo,
  updateNotificationTemplateRepo,
  type ListNotificationTemplatesParams,
} from '../repository';
import { normalizeChannel } from '../utils';
export async function listNotificationTemplatesSvc(params: ListNotificationTemplatesParams) {
  return listNotificationTemplatesRepo(params);
}

export async function getNotificationTemplateSvc(input: { id: string; companyId: string }) {
  const template = await getNotificationTemplateByIdRepo(input.id, input.companyId);
  if (!template) throw NotFound('Notification template not found');
  return template;
}

export async function listNotificationTemplateOptionsSvc(input: {
  companyId: string;
  channel?: string | null;
}) {
  return listNotificationTemplateOptionsRepo(input.companyId, input.channel ?? null);
}

export async function createNotificationTemplateSvc(input: {
  companyId: string;
  createdBy: string;
  channel: string;
  code: string;
  name: string;
  subject?: string | null;
  body: string;
  variablesJson?: unknown;
  isActive?: boolean;
}) {
  const created = await createNotificationTemplateRepo({
    companyId: input.companyId,
    createdBy: input.createdBy,
    channel: normalizeChannel(input.channel),
    code: input.code.trim().toLowerCase(),
    name: input.name.trim(),
    subject: input.subject?.trim() || null,
    body: input.body,
    variablesJson: input.variablesJson ?? null,
    isActive: input.isActive ?? true,
  });
  if (!created) throw Conflict('Failed to create notification template');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy,
    entityType: 'notification_template',
    entityId: created.id,
    action: 'NOTIFICATION_TEMPLATE_CREATED',
    message: `Notification template created: ${input.name}`,
    metadata: { channel: input.channel, code: input.code },
  });

  return created;
}

export async function updateNotificationTemplateSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  patch: {
    name?: string;
    subject?: string | null;
    body?: string;
    variablesJson?: unknown;
    isActive?: boolean;
  };
}) {
  const updated = await updateNotificationTemplateRepo(input.id, input.companyId, {
    name: input.patch.name?.trim(),
    subject: input.patch.subject?.trim() ?? input.patch.subject,
    body: input.patch.body,
    variablesJson: input.patch.variablesJson,
    isActive: input.patch.isActive,
    updatedAt: new Date(),
  } satisfies Partial<typeof notificationTemplates.$inferInsert>);

  if (!updated) throw NotFound('Notification template not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'notification_template',
    entityId: input.id,
    action: 'NOTIFICATION_TEMPLATE_UPDATED',
    message: 'Notification template updated',
    metadata: { patch: input.patch },
  });

  return updated;
}
