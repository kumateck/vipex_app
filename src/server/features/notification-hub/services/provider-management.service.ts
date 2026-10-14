import { Conflict, NotFound } from '@/server/utils/http-error';
import { recordAuditLog } from '../../audit/logger';
import { notificationProviders } from '@/db/schemas';
import {
  clearDefaultProviderByChannelRepo,
  createNotificationProviderRepo,
  getNotificationProviderByIdRepo,
  listNotificationProvidersRepo,
  updateNotificationProviderRepo,
  type ListNotificationProvidersParams,
} from '../repository';
import { normalizeChannel } from '../utils';
export async function listNotificationProvidersSvc(params: ListNotificationProvidersParams) {
  return listNotificationProvidersRepo(params);
}

export async function getNotificationProviderSvc(input: { id: string; companyId: string }) {
  const provider = await getNotificationProviderByIdRepo(input.id, input.companyId);
  if (!provider) throw NotFound('Notification provider not found');
  return provider;
}

export async function createNotificationProviderSvc(input: {
  companyId: string;
  createdBy: string;
  channel: string;
  providerKey: string;
  name: string;
  configJson?: unknown;
  isActive?: boolean;
  isDefault?: boolean;
}) {
  const channel = normalizeChannel(input.channel);
  if (input.isDefault) {
    await clearDefaultProviderByChannelRepo(input.companyId, channel);
  }

  const created = await createNotificationProviderRepo({
    companyId: input.companyId,
    createdBy: input.createdBy,
    channel,
    providerKey: input.providerKey.trim().toLowerCase(),
    name: input.name.trim(),
    configJson: input.configJson ?? null,
    isActive: input.isActive ?? true,
    isDefault: input.isDefault ?? false,
  });

  if (!created) throw Conflict('Failed to create notification provider');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy,
    entityType: 'notification_provider',
    entityId: created.id,
    action: 'NOTIFICATION_PROVIDER_CREATED',
    message: `Notification provider created: ${input.name}`,
    metadata: {
      channel,
      providerKey: input.providerKey,
      isDefault: input.isDefault ?? false,
    },
  });

  return created;
}

export async function updateNotificationProviderSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  patch: {
    name?: string;
    configJson?: unknown;
    isActive?: boolean;
    isDefault?: boolean;
  };
}) {
  const existing = await getNotificationProviderByIdRepo(input.id, input.companyId);
  if (!existing) throw NotFound('Notification provider not found');

  if (input.patch.isDefault) {
    await clearDefaultProviderByChannelRepo(input.companyId, existing.channel);
  }

  const updated = await updateNotificationProviderRepo(input.id, input.companyId, {
    name: input.patch.name?.trim(),
    configJson: input.patch.configJson,
    isActive: input.patch.isActive,
    isDefault: input.patch.isDefault,
    updatedAt: new Date(),
  } satisfies Partial<typeof notificationProviders.$inferInsert>);

  if (!updated) throw NotFound('Notification provider not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'notification_provider',
    entityId: input.id,
    action: 'NOTIFICATION_PROVIDER_UPDATED',
    message: 'Notification provider updated',
    metadata: { patch: input.patch },
  });

  return updated;
}

export async function setDefaultNotificationProviderSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
}) {
  const existing = await getNotificationProviderByIdRepo(input.id, input.companyId);
  if (!existing) throw NotFound('Notification provider not found');
  await clearDefaultProviderByChannelRepo(input.companyId, existing.channel);
  const updated = await updateNotificationProviderRepo(input.id, input.companyId, {
    isDefault: true,
    isActive: true,
    updatedAt: new Date(),
  });
  if (!updated) throw NotFound('Notification provider not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'notification_provider',
    entityId: input.id,
    action: 'NOTIFICATION_PROVIDER_SET_DEFAULT',
    message: `Default provider set for ${existing.channel}: ${existing.name}`,
  });

  return updated;
}
