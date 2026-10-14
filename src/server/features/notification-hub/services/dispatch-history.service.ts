import { NotFound } from '@/server/utils/http-error';
import { recordAuditLog } from '../../audit/logger';
import {
  getDefaultProviderByChannelRepo,
  getNotificationDispatchByIdRepo,
  listCampaignRecipientsDispatchesRepo,
  listNotificationDispatchesRepo,
  updateNotificationDispatchResultRepo,
  type ListNotificationDispatchesParams,
} from '../repository';
import { dispatchSingleMessage } from './dispatch-message.service';
import { assertDispatchCanBeRetried } from '../utils';
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
  assertDispatchCanBeRetried(dispatch.metadataJson);

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
