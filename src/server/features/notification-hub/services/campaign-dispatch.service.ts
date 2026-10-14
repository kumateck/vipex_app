import { Conflict, NotFound } from '@/server/utils/http-error';
import { recordAuditLog } from '../../audit/logger';
import { NotificationCampaignStatus } from '@/db/schemas';
import { buildCampaignTemplateValues } from '../campaign-template-values';
import {
  createNotificationDispatchRepo,
  getDefaultProviderByChannelRepo,
  getNotificationCampaignByIdRepo,
  getNotificationSenderContextRepo,
  getNotificationTemplateByIdRepo,
  resolveAudienceRecipientsRepo,
  updateNotificationCampaignRepo,
} from '../repository';
import { normalizeChannel, renderTemplate } from '../utils';
import { dispatchSingleMessage } from './dispatch-message.service';
async function resolveCampaignMessageContent(input: {
  companyId: string;
  campaign: Awaited<ReturnType<typeof getNotificationCampaignByIdRepo>>;
  recipientName?: string | null;
  recipientPhone?: string | null;
  senderName?: string | null;
  senderPhone?: string | null;
  branch?: string | null;
  location?: string | null;
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

  const values = buildCampaignTemplateValues(input);
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

  const [provider, sender] = await Promise.all([
    getDefaultProviderByChannelRepo(input.companyId, channel),
    getNotificationSenderContextRepo({
      companyId: input.companyId,
      userId: input.actorUserId,
    }),
  ]);
  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of recipients) {
    const content = await resolveCampaignMessageContent({
      companyId: input.companyId,
      campaign,
      recipientName: recipient.recipientName,
      recipientPhone: recipient.recipientPhone,
      senderName: sender?.senderName,
      senderPhone: sender?.senderPhone,
      branch: sender?.branch,
      location: sender?.location,
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
