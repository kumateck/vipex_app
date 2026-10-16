import {
  createNotificationDispatchRepo,
  getDefaultProviderByChannelRepo,
  getNotificationTemplateByCodeRepo,
} from '../repository';
import {
  buildWhatsAppEventParams,
  buildWhatsAppEventPreview,
  getWhatsAppEventDefinition,
  type WhatsAppEventCode,
} from '../whatsapp-event-definitions';
import type { WhatsAppTemplateMessage } from '../providers';
import type { DeliveryResult } from '../types';
import { dispatchSingleMessage } from './dispatch-message.service';

export const WHATSAPP_CHANNEL = 'whatsapp';

/** Company override of the Meta template name (`body`) and language (`subject`). */
export async function resolveWhatsAppTemplateSvc(companyId: string, eventCode: string) {
  const definition = getWhatsAppEventDefinition(eventCode);
  if (!definition) return null;
  const override = await getNotificationTemplateByCodeRepo(
    companyId,
    WHATSAPP_CHANNEL,
    definition.code,
  );
  return {
    definition,
    templateName: override?.body?.trim() || definition.defaultTemplateName,
    language: override?.subject?.trim() || definition.defaultLanguage,
  };
}

export async function dispatchWhatsAppEventSvc(input: {
  companyId: string;
  eventCode: WhatsAppEventCode;
  phone: string;
  recipientType: string;
  recipientId?: string | null;
  recipientName?: string | null;
  variables: Record<string, string | number | null | undefined>;
  metadataJson?: Record<string, unknown> | null;
}): Promise<DeliveryResult> {
  const resolved = await resolveWhatsAppTemplateSvc(input.companyId, input.eventCode);
  if (!resolved) return { status: 'failed', errorMessage: 'Unknown application WhatsApp event' };
  const { definition, templateName, language } = resolved;

  const message: WhatsAppTemplateMessage = {
    templateName,
    language,
    ...buildWhatsAppEventParams(definition, input.variables),
  };
  const isSensitive = Boolean(definition.sensitiveVariables?.length);

  const provider = await getDefaultProviderByChannelRepo(input.companyId, WHATSAPP_CHANNEL);
  const createdDispatch = await createNotificationDispatchRepo({
    companyId: input.companyId,
    campaignId: null,
    channel: WHATSAPP_CHANNEL,
    providerId: provider?.id ?? null,
    providerKey: provider?.providerKey ?? null,
    recipientType: input.recipientType,
    recipientId: input.recipientId ?? null,
    recipientName: input.recipientName ?? null,
    recipientAddress: input.phone,
    subject: null,
    body: buildWhatsAppEventPreview(definition, templateName, input.variables),
    status: 'pending',
    attemptCount: 0,
    metadataJson: {
      ...input.metadataJson,
      eventCode: definition.code,
      // Kept so the log can be retried; never stored for sensitive (OTP) templates.
      ...(isSensitive ? {} : { whatsappTemplate: message }),
    },
  });

  if (!createdDispatch) {
    return { status: 'failed', errorMessage: 'Failed to create notification dispatch record' };
  }

  return dispatchSingleMessage({
    companyId: input.companyId,
    provider,
    dispatchId: createdDispatch.id,
    channel: WHATSAPP_CHANNEL,
    recipientAddress: input.phone,
    subject: null,
    body: '',
    whatsappMessage: message,
  });
}
