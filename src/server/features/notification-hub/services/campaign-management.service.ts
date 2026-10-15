import { Conflict, NotFound } from '@/server/utils/http-error';
import { recordAuditLog } from '../../audit/logger';
import { NotificationCampaignStatus } from '@/db/schemas';
import {
  createNotificationCampaignRepo,
  getNotificationCampaignByIdRepo,
  getNotificationTemplateByIdRepo,
  listNotificationCampaignsRepo,
  updateNotificationCampaignRepo,
  type ListNotificationCampaignsParams,
} from '../repository';
import { normalizeChannel, normalizeEventCode } from '../utils';
export async function listNotificationCampaignsSvc(params: ListNotificationCampaignsParams) {
  return listNotificationCampaignsRepo(params);
}

export async function createNotificationCampaignSvc(input: {
  companyId: string;
  createdBy: string;
  name: string;
  eventCode?: string | null;
  channel: string;
  templateId?: string | null;
  subjectOverride?: string | null;
  bodyOverride?: string | null;
  audienceType: string;
  scheduledAt?: Date | null;
}) {
  if (input.templateId) {
    const template = await getNotificationTemplateByIdRepo(input.templateId, input.companyId);
    if (!template) throw NotFound('Template not found');
  }

  const created = await createNotificationCampaignRepo({
    companyId: input.companyId,
    createdBy: input.createdBy,
    name: input.name.trim(),
    eventCode: normalizeEventCode(input.eventCode),
    channel: normalizeChannel(input.channel),
    templateId: input.templateId ?? null,
    subjectOverride: input.subjectOverride?.trim() || null,
    bodyOverride: input.bodyOverride || null,
    audienceType: input.audienceType.trim().toLowerCase(),
    status: NotificationCampaignStatus.DRAFT,
    scheduledAt: input.scheduledAt ?? null,
  });
  if (!created) throw Conflict('Failed to create campaign');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy,
    entityType: 'notification_campaign',
    entityId: created.id,
    action: 'NOTIFICATION_CAMPAIGN_CREATED',
    message: `Notification campaign created: ${input.name}`,
  });

  return created;
}

export async function submitNotificationCampaignSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
}) {
  const existing = await getNotificationCampaignByIdRepo(input.id, input.companyId);
  if (!existing) throw NotFound('Campaign not found');
  if (
    existing.status !== NotificationCampaignStatus.DRAFT &&
    existing.status !== NotificationCampaignStatus.REJECTED
  ) {
    throw Conflict('Only draft or rejected campaigns can be submitted');
  }

  const updated = await updateNotificationCampaignRepo(input.id, input.companyId, {
    status: NotificationCampaignStatus.SUBMITTED,
    submittedBy: input.actorUserId,
    submittedAt: new Date(),
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    approvalNote: null,
  });
  if (!updated) throw NotFound('Campaign not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'notification_campaign',
    entityId: input.id,
    action: 'NOTIFICATION_CAMPAIGN_SUBMITTED',
    message: `Notification campaign submitted: ${existing.name}`,
  });

  return updated;
}

export async function approveNotificationCampaignSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  note?: string | null;
}) {
  const existing = await getNotificationCampaignByIdRepo(input.id, input.companyId);
  if (!existing) throw NotFound('Campaign not found');
  if (existing.status !== NotificationCampaignStatus.SUBMITTED) {
    throw Conflict('Only submitted campaigns can be approved');
  }

  const updated = await updateNotificationCampaignRepo(input.id, input.companyId, {
    status: NotificationCampaignStatus.APPROVED,
    approvedBy: input.actorUserId,
    approvedAt: new Date(),
    rejectedBy: null,
    rejectedAt: null,
    approvalNote: input.note?.trim() || null,
  });
  if (!updated) throw NotFound('Campaign not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'notification_campaign',
    entityId: input.id,
    action: 'NOTIFICATION_CAMPAIGN_APPROVED',
    message: `Notification campaign approved: ${existing.name}`,
    metadata: { note: input.note ?? null },
  });

  return updated;
}

export async function rejectNotificationCampaignSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  note: string;
}) {
  const existing = await getNotificationCampaignByIdRepo(input.id, input.companyId);
  if (!existing) throw NotFound('Campaign not found');
  if (existing.status !== NotificationCampaignStatus.SUBMITTED) {
    throw Conflict('Only submitted campaigns can be rejected');
  }

  const updated = await updateNotificationCampaignRepo(input.id, input.companyId, {
    status: NotificationCampaignStatus.REJECTED,
    rejectedBy: input.actorUserId,
    rejectedAt: new Date(),
    approvedBy: null,
    approvedAt: null,
    approvalNote: input.note.trim(),
  });
  if (!updated) throw NotFound('Campaign not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'notification_campaign',
    entityId: input.id,
    action: 'NOTIFICATION_CAMPAIGN_REJECTED',
    message: `Notification campaign rejected: ${existing.name}`,
    metadata: { note: input.note },
  });

  return updated;
}
