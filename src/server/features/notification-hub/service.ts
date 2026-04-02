import { Conflict, NotFound } from '@/server/utils/http-error';
import { recordAuditLog } from '../audit/logger';
import { sendMail } from '@/server/services/mail/mailer';
import {
  NotificationCampaignStatus,
  notificationDispatches,
  notificationProviders,
  notificationTemplates,
} from '@/db/schemas';
import {
  clearDefaultProviderByChannelRepo,
  createNotificationCampaignRepo,
  createNotificationDispatchRepo,
  createNotificationProviderRepo,
  createNotificationTemplateRepo,
  getDefaultProviderByChannelRepo,
  getNotificationCampaignByIdRepo,
  getNotificationDispatchByIdRepo,
  getNotificationProviderByIdRepo,
  getNotificationTemplateByIdRepo,
  getParcelRecipientsRepo,
  listCampaignRecipientsDispatchesRepo,
  listNotificationCampaignsRepo,
  listNotificationDispatchesRepo,
  listNotificationProvidersRepo,
  listNotificationTemplateOptionsRepo,
  listNotificationTemplatesRepo,
  resolveAudienceRecipientsRepo,
  updateNotificationCampaignRepo,
  updateNotificationDispatchResultRepo,
  updateNotificationProviderRepo,
  updateNotificationTemplateRepo,
  type ListNotificationCampaignsParams,
  type ListNotificationDispatchesParams,
  type ListNotificationProvidersParams,
  type ListNotificationTemplatesParams,
} from './repository';

type ProviderRow = Awaited<ReturnType<typeof getDefaultProviderByChannelRepo>>;

type DeliveryResult = {
  status: 'sent' | 'failed';
  providerMessageId?: string | null;
  errorMessage?: string | null;
};

function normalizeChannel(channel: string) {
  return channel.trim().toLowerCase();
}

function normalizeEventCode(eventCode?: string | null) {
  const value = eventCode?.trim();
  return value ? value.toLowerCase() : null;
}

function renderTemplate(
  template: string,
  values: Record<string, string | number | null | undefined>,
) {
  let output = template;
  for (const [key, value] of Object.entries(values)) {
    output = output.replaceAll(`{{${key}}}`, String(value ?? ''));
  }
  return output;
}

async function sendSmsWithProvider(provider: NonNullable<ProviderRow>, to: string, body: string) {
  const key = provider.providerKey.toLowerCase();
  const cfg = (provider.configJson ?? {}) as Record<string, unknown>;

  if (key === 'log_only') {
    return {
      status: 'sent',
      providerMessageId: `log_${Date.now()}`,
    } satisfies DeliveryResult;
  }

  if (key === 'custom_webhook') {
    const url = typeof cfg.url === 'string' ? cfg.url : '';
    if (!url) {
      return {
        status: 'failed',
        errorMessage: 'SMS provider custom_webhook is missing config.url',
      } satisfies DeliveryResult;
    }

    const headers =
      (cfg.headers && typeof cfg.headers === 'object'
        ? (cfg.headers as Record<string, string>)
        : {}) ?? {};
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        to,
        message: body,
        providerKey: provider.providerKey,
        channel: 'sms',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        status: 'failed',
        errorMessage: `custom_webhook returned ${response.status}: ${errorText.slice(0, 500)}`,
      } satisfies DeliveryResult;
    }

    let providerMessageId: string | null = null;
    try {
      const payload = (await response.json()) as { messageId?: string; id?: string };
      providerMessageId = payload.messageId ?? payload.id ?? null;
    } catch {
      providerMessageId = null;
    }
    return {
      status: 'sent',
      providerMessageId,
    } satisfies DeliveryResult;
  }

  return {
    status: 'failed',
    errorMessage: `Unsupported SMS provider key: ${provider.providerKey}`,
  } satisfies DeliveryResult;
}

async function sendEmailWithProvider(input: {
  to: string;
  subject: string;
  body: string;
}): Promise<DeliveryResult> {
  if (!input.subject.trim()) {
    return {
      status: 'failed',
      errorMessage: 'Email subject is required',
    };
  }

  try {
    const info = await sendMail({
      to: input.to,
      subject: input.subject,
      text: input.body,
      html: `<pre style="font-family:inherit;white-space:pre-wrap;margin:0">${input.body}</pre>`,
    });
    return { status: 'sent', providerMessageId: info.messageId ?? null };
  } catch (error) {
    return {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

async function dispatchSingleMessage(input: {
  companyId: string;
  provider: ProviderRow;
  dispatchId: string;
  channel: string;
  recipientAddress: string;
  subject: string | null;
  body: string;
}) {
  const channel = normalizeChannel(input.channel);
  const provider = input.provider;
  const providerId = provider?.id ?? null;
  const providerKey = provider?.providerKey ?? null;

  let result: DeliveryResult;
  if (!provider) {
    result = {
      status: 'failed',
      errorMessage: `No active default provider configured for ${channel}`,
    };
  } else if (channel === 'sms') {
    result = await sendSmsWithProvider(provider, input.recipientAddress, input.body);
  } else if (channel === 'email') {
    result = await sendEmailWithProvider({
      to: input.recipientAddress,
      subject: input.subject ?? '',
      body: input.body,
    });
  } else {
    result = {
      status: 'failed',
      errorMessage: `Unsupported notification channel: ${channel}`,
    };
  }

  await updateNotificationDispatchResultRepo(input.dispatchId, input.companyId, {
    status: result.status,
    attemptCount: 1,
    providerId,
    providerKey,
    providerMessageId: result.providerMessageId ?? null,
    errorMessage: result.errorMessage ?? null,
  } satisfies Partial<typeof notificationDispatches.$inferInsert>);

  return result;
}

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

async function resolveCampaignMessageContent(input: {
  companyId: string;
  campaign: Awaited<ReturnType<typeof getNotificationCampaignByIdRepo>>;
  recipientName?: string | null;
}) {
  if (!input.campaign) throw NotFound('Campaign not found');
  const channel = normalizeChannel(input.campaign.channel);
  const template = input.campaign.templateId
    ? await getNotificationTemplateByIdRepo(input.campaign.templateId, input.companyId)
    : null;
  const subjectTemplate = input.campaign.subjectOverride || template?.subject || '';
  const bodyTemplate = input.campaign.bodyOverride || template?.body || '';

  if (!bodyTemplate.trim()) {
    throw Conflict('Campaign body is empty. Add a body override or a template body.');
  }

  const values = {
    recipientName: input.recipientName ?? '',
    companyId: input.companyId,
    date: new Date().toISOString().slice(0, 10),
  };
  const subject = channel === 'email' ? renderTemplate(subjectTemplate, values) : null;
  const body = renderTemplate(bodyTemplate, values);
  return { subject, body };
}

export async function sendNotificationCampaignSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
}) {
  const campaign = await getNotificationCampaignByIdRepo(input.id, input.companyId);
  if (!campaign) throw NotFound('Campaign not found');
  if (campaign.status !== NotificationCampaignStatus.APPROVED) {
    throw Conflict('Only approved campaigns can be sent');
  }

  const channel = normalizeChannel(campaign.channel);
  const recipients = await resolveAudienceRecipientsRepo({
    companyId: input.companyId,
    channel,
    audienceType: campaign.audienceType,
  });
  if (!recipients.length) {
    throw Conflict('No recipients matched the selected audience for this campaign');
  }

  const provider = await getDefaultProviderByChannelRepo(input.companyId, channel);
  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of recipients) {
    const content = await resolveCampaignMessageContent({
      companyId: input.companyId,
      campaign,
      recipientName: recipient.recipientName,
    });
    const createdDispatch = await createNotificationDispatchRepo({
      companyId: input.companyId,
      campaignId: campaign.id,
      channel,
      providerId: provider?.id ?? null,
      providerKey: provider?.providerKey ?? null,
      recipientType: recipient.recipientType,
      recipientId: recipient.recipientId,
      recipientName: recipient.recipientName,
      recipientAddress: recipient.recipientAddress,
      subject: content.subject,
      body: content.body,
      status: 'pending',
      attemptCount: 0,
      metadataJson: { audienceType: campaign.audienceType },
    });

    if (!createdDispatch) {
      failedCount += 1;
      continue;
    }

    const result = await dispatchSingleMessage({
      companyId: input.companyId,
      provider,
      dispatchId: createdDispatch.id,
      channel,
      recipientAddress: recipient.recipientAddress,
      subject: content.subject,
      body: content.body,
    });

    if (result.status === 'sent') sentCount += 1;
    else failedCount += 1;
  }

  await updateNotificationCampaignRepo(input.id, input.companyId, {
    status: NotificationCampaignStatus.SENT,
    sentBy: input.actorUserId,
    sentAt: new Date(),
    updatedAt: new Date(),
  });

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'notification_campaign',
    entityId: input.id,
    action: 'NOTIFICATION_CAMPAIGN_SENT',
    message: `Notification campaign sent: ${campaign.name}`,
    metadata: { sentCount, failedCount, audienceType: campaign.audienceType },
  });

  return { id: input.id, sentCount, failedCount };
}

export async function listNotificationDispatchesSvc(params: ListNotificationDispatchesParams) {
  return listNotificationDispatchesRepo(params);
}

export async function retryNotificationDispatchSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
}) {
  const dispatch = await getNotificationDispatchByIdRepo(input.id, input.companyId);
  if (!dispatch) throw NotFound('Dispatch not found');

  const provider = await getDefaultProviderByChannelRepo(input.companyId, dispatch.channel);
  const result = await dispatchSingleMessage({
    companyId: input.companyId,
    provider,
    dispatchId: input.id,
    channel: dispatch.channel,
    recipientAddress: dispatch.recipientAddress,
    subject: dispatch.subject,
    body: dispatch.body,
  });

  await updateNotificationDispatchResultRepo(input.id, input.companyId, {
    attemptCount: (dispatch.attemptCount ?? 0) + 1,
  });

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'notification_dispatch',
    entityId: input.id,
    action: 'NOTIFICATION_DISPATCH_RETRIED',
    message: `Notification dispatch retried (${dispatch.channel})`,
    metadata: { status: result.status },
  });

  return { id: input.id, status: result.status };
}

function buildCallCenterMessage(input: {
  outcome: string;
  trackingCode: string;
  bookingCode: string;
  recipientName: string;
}) {
  const label = input.recipientName.trim() || 'Customer';
  const tracking = input.trackingCode;
  const booking = input.bookingCode;
  const outcome = input.outcome.trim().toLowerCase();

  if (outcome === 'pickup') {
    return `${label}, your parcel ${tracking} (booking ${booking}) is ready for pickup.`;
  }
  if (outcome === 'delivery') {
    return `${label}, your parcel ${tracking} (booking ${booking}) has been marked for delivery dispatch.`;
  }
  if (outcome === 'follow_up') {
    return `${label}, thank you. We will follow up on parcel ${tracking} (booking ${booking}).`;
  }
  return `${label}, your parcel ${tracking} (booking ${booking}) has been updated after our call.`;
}

export async function sendParcelStatusNotificationSvc(input: {
  companyId: string;
  actorUserId: string;
  parcelId: string;
  outcome: string;
  sendSms?: boolean;
  sendEmail?: boolean;
  includeSecondReceiver?: boolean;
}) {
  const parcel = await getParcelRecipientsRepo(input.companyId, input.parcelId);
  if (!parcel) throw NotFound('Parcel not found');

  const recipients = [
    { ...parcel.primary, role: 'receiver' as const },
    ...(input.includeSecondReceiver && parcel.secondary
      ? [{ ...parcel.secondary, role: 'second_receiver' as const }]
      : []),
  ];

  let sentCount = 0;
  let failedCount = 0;

  if (input.sendSms) {
    const smsProvider = await getDefaultProviderByChannelRepo(input.companyId, 'sms');
    for (const recipient of recipients) {
      if (!recipient.phone) continue;
      const body = buildCallCenterMessage({
        outcome: input.outcome,
        trackingCode: parcel.trackingCode,
        bookingCode: parcel.bookingCode,
        recipientName: recipient.name ?? 'Customer',
      });
      const createdDispatch = await createNotificationDispatchRepo({
        companyId: input.companyId,
        campaignId: null,
        channel: 'sms',
        providerId: smsProvider?.id ?? null,
        providerKey: smsProvider?.providerKey ?? null,
        recipientType: recipient.role,
        recipientId: recipient.id,
        recipientName: recipient.name ?? null,
        recipientAddress: recipient.phone,
        subject: null,
        body,
        status: 'pending',
        attemptCount: 0,
        metadataJson: {
          eventCode: 'parcel_status_call',
          parcelId: parcel.parcelId,
          trackingCode: parcel.trackingCode,
          outcome: input.outcome,
        },
      });
      if (!createdDispatch) {
        failedCount += 1;
        continue;
      }

      const result = await dispatchSingleMessage({
        companyId: input.companyId,
        provider: smsProvider,
        dispatchId: createdDispatch.id,
        channel: 'sms',
        recipientAddress: recipient.phone,
        subject: null,
        body,
      });
      if (result.status === 'sent') sentCount += 1;
      else failedCount += 1;
    }
  }

  if (input.sendEmail) {
    const emailProvider = await getDefaultProviderByChannelRepo(input.companyId, 'email');
    for (const recipient of recipients) {
      if (!recipient.email) continue;
      const body = buildCallCenterMessage({
        outcome: input.outcome,
        trackingCode: parcel.trackingCode,
        bookingCode: parcel.bookingCode,
        recipientName: recipient.name ?? 'Customer',
      });
      const subject = `Parcel Update: ${parcel.trackingCode}`;
      const createdDispatch = await createNotificationDispatchRepo({
        companyId: input.companyId,
        campaignId: null,
        channel: 'email',
        providerId: emailProvider?.id ?? null,
        providerKey: emailProvider?.providerKey ?? null,
        recipientType: recipient.role,
        recipientId: recipient.id,
        recipientName: recipient.name ?? null,
        recipientAddress: recipient.email,
        subject,
        body,
        status: 'pending',
        attemptCount: 0,
        metadataJson: {
          eventCode: 'parcel_status_call',
          parcelId: parcel.parcelId,
          trackingCode: parcel.trackingCode,
          outcome: input.outcome,
        },
      });
      if (!createdDispatch) {
        failedCount += 1;
        continue;
      }

      const result = await dispatchSingleMessage({
        companyId: input.companyId,
        provider: emailProvider,
        dispatchId: createdDispatch.id,
        channel: 'email',
        recipientAddress: recipient.email,
        subject,
        body,
      });
      if (result.status === 'sent') sentCount += 1;
      else failedCount += 1;
    }
  }

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'notification_dispatch',
    entityId: input.parcelId,
    action: 'CALL_CENTER_NOTIFICATION_SENT',
    message: `Call center notification sent for parcel ${parcel.trackingCode}`,
    metadata: {
      parcelId: input.parcelId,
      trackingCode: parcel.trackingCode,
      sendSms: Boolean(input.sendSms),
      sendEmail: Boolean(input.sendEmail),
      sentCount,
      failedCount,
    },
  });

  return {
    parcelId: input.parcelId,
    trackingCode: parcel.trackingCode,
    sentCount,
    failedCount,
  };
}

export async function listCampaignDispatchSummarySvc(input: {
  companyId: string;
  campaignId: string;
}) {
  const rows = await listCampaignRecipientsDispatchesRepo(input.campaignId, input.companyId);
  const sentCount = rows.filter((row) => row.status === 'sent').length;
  const failedCount = rows.filter((row) => row.status === 'failed').length;
  const pendingCount = rows.filter((row) => row.status === 'pending').length;
  return {
    campaignId: input.campaignId,
    total: rows.length,
    sentCount,
    failedCount,
    pendingCount,
  };
}
