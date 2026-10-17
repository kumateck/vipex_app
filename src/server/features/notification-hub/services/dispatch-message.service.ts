import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { sendMail } from '@/server/services/mail/mailer';
import { notificationDispatches } from '@/db/schemas';
import { updateNotificationDispatchResultRepo } from '../repository';
import type { DeliveryResult, ProviderRow } from '../types';
import type { SmsType } from '../sms-provider-payloads';
import { normalizeChannel } from '../utils';
import {
  sendSmsWithProvider,
  sendWhatsAppTemplate,
  type WhatsAppTemplateMessage,
} from '../providers';
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
      errorMessage: getApplicationErrorMessage(error, '') || 'Failed to send email',
    };
  }
}

export async function dispatchSingleMessage(input: {
  companyId: string;
  provider: ProviderRow;
  dispatchId: string;
  channel: string;
  recipientAddress: string;
  subject: string | null;
  body: string;
  smsType?: SmsType;
  /** Required for the whatsapp channel: Meta only accepts approved templates. */
  whatsappMessage?: WhatsAppTemplateMessage | null;
}) {
  const channel = normalizeChannel(input.channel);
  const provider = input.provider;
  const providerId = provider?.id ?? null;
  const providerKey = provider?.providerKey ?? null;

  let result: DeliveryResult;
  try {
    if (!provider) {
      result = {
        status: 'failed',
        errorMessage: `No active default provider configured for ${channel}`,
      };
    } else if (channel === 'sms') {
      result = await sendSmsWithProvider(
        provider,
        input.recipientAddress,
        input.body,
        input.smsType,
      );
    } else if (channel === 'email') {
      result = await sendEmailWithProvider({
        to: input.recipientAddress,
        subject: input.subject ?? '',
        body: input.body,
      });
    } else if (channel === 'whatsapp') {
      result = input.whatsappMessage
        ? await sendWhatsAppTemplate({
            config: provider.configJson,
            recipient: input.recipientAddress,
            message: input.whatsappMessage,
          })
        : { status: 'failed', errorMessage: 'WhatsApp messages require an approved template' };
    } else {
      result = {
        status: 'failed',
        errorMessage: `Unsupported notification channel: ${channel}`,
      };
    }
  } catch (error) {
    result = {
      status: 'failed',
      errorMessage: getApplicationErrorMessage(error, '') || 'Notification transport failed',
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
