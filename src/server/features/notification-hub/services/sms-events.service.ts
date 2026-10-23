import {
  createNotificationDispatchRepo,
  getDefaultProviderByChannelRepo,
  getNotificationTemplateByCodeRepo,
  updateNotificationDispatchResultRepo,
} from '../repository';
import { getSmsEventDefinition, type SmsEventCode } from '../sms-event-definitions';
import { renderTemplate, getSmsEventBodyError } from '../utils';
import type { DeliveryResult } from '../types';
import type { SmsType } from '../sms-provider-payloads';
import { dispatchSingleMessage } from './dispatch-message.service';
export async function sendSmsSvc(input: {
  companyId: string;
  phone: string;
  body: string;
  recipientType: string;
  recipientId?: string | null;
  recipientName?: string | null;
  metadataJson?: Record<string, unknown> | null;
  smsType?: SmsType;
  validationError?: string | null;
}): Promise<DeliveryResult> {
  const provider = await getDefaultProviderByChannelRepo(input.companyId, 'sms');
  const createdDispatch = await createNotificationDispatchRepo({
    companyId: input.companyId,
    campaignId: null,
    channel: 'sms',
    providerId: provider?.id ?? null,
    providerKey: provider?.providerKey ?? null,
    recipientType: input.recipientType,
    recipientId: input.recipientId ?? null,
    recipientName: input.recipientName ?? null,
    recipientAddress: input.phone,
    subject: null,
    body: input.body,
    status: 'pending',
    attemptCount: 0,
    metadataJson: input.metadataJson ?? null,
  });

  if (!createdDispatch) {
    return { status: 'failed', errorMessage: 'Failed to create notification dispatch record' };
  }

  if (input.validationError) {
    const result = { status: 'failed' as const, errorMessage: input.validationError };
    await updateNotificationDispatchResultRepo(createdDispatch.id, input.companyId, {
      ...result,
      attemptCount: 0,
    });
    return result;
  }

  return dispatchSingleMessage({
    companyId: input.companyId,
    provider,
    dispatchId: createdDispatch.id,
    channel: 'sms',
    recipientAddress: input.phone,
    subject: null,
    body: input.body,
    smsType: input.smsType,
  });
}

export async function dispatchSmsEventSvc(input: {
  companyId: string;
  eventCode: SmsEventCode;
  phone: string;
  recipientType: string;
  recipientId?: string | null;
  recipientName?: string | null;
  variables: Record<string, string | number | null | undefined>;
  metadataJson?: Record<string, unknown> | null;
}): Promise<DeliveryResult> {
  const definition = getSmsEventDefinition(input.eventCode);
  if (!definition) return { status: 'failed', errorMessage: 'Unknown application SMS event' };
  const template = await getNotificationTemplateByCodeRepo(input.companyId, 'sms', definition.code);
  const messageTemplate = template?.body ?? definition.defaultBody;
  const body = renderTemplate(messageTemplate, {
    ...buildSmsLocationVariables({
      location: String(input.variables.location ?? ''),
      locationPhone: String(input.variables.locationPhone ?? ''),
    }),
    ...input.variables,
  });

  return sendSmsSvc({
    companyId: input.companyId,
    phone: input.phone,
    body,
    recipientType: input.recipientType,
    recipientId: input.recipientId,
    recipientName: input.recipientName,
    metadataJson: {
      ...input.metadataJson,
      eventCode: definition.code,
    },
    smsType: definition.smsType,
    validationError: getSmsEventBodyError(definition.smsType, messageTemplate),
  });
}
import { buildSmsLocationVariables } from '@/shared/notification-hub';
