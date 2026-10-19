import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { env } from '@/server/utils/env';
import type { DeliveryResult, ProviderRow } from '../types';
import type { SmsType } from '../sms-provider-payloads';
import { sendMnotifySms } from './mnotify-sms-provider';
export async function sendSmsWithProvider(
  provider: NonNullable<ProviderRow>,
  to: string,
  body: string,
  smsType?: SmsType,
) {
  const key = provider.providerKey.toLowerCase();
  const cfg = (provider.configJson ?? {}) as Record<string, unknown>;

  if (key === 'log_only') {
    if (smsType === 'otp')
      return {
        status: 'failed',
        errorMessage:
          'Log-only SMS provider cannot deliver pickup OTPs; configure an active SMS provider',
      } satisfies DeliveryResult;
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
        ...(smsType ? { sms_type: smsType } : {}),
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

  if (key === 'mtn') {
    const subscriptionKey =
      (typeof cfg.subscriptionKey === 'string' && cfg.subscriptionKey) ||
      env.MTN_SMS_DEFAULT_SUBSCRIPTION_KEY ||
      '';
    const senderId = typeof cfg.senderId === 'string' ? cfg.senderId : '';
    const apiUrl = (typeof cfg.apiUrl === 'string' && cfg.apiUrl) || env.MTN_SMS_API_BASE_URL || '';

    if (!subscriptionKey || !senderId || !apiUrl) {
      return {
        status: 'failed',
        errorMessage: 'MTN SMS provider is missing configuration (subscriptionKey/senderId/apiUrl)',
      } satisfies DeliveryResult;
    }

    try {
      const response = await fetch(`${apiUrl}/sms/messages/sms/outbound`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Ocp-Apim-Subscription-Key': subscriptionKey,
        },
        body: JSON.stringify({
          senderAddress: senderId,
          receiverAddress: [to],
          message: body,
          clientCorrelatorId: `${Date.now()}`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          status: 'failed',
          errorMessage: `MTN SMS API returned ${response.status}: ${errorText.slice(0, 500)}`,
        } satisfies DeliveryResult;
      }

      let providerMessageId: string | null = null;
      try {
        const payload = (await response.json()) as {
          requestId?: string;
          resourceReference?: { resourceURL?: string };
        };
        providerMessageId = payload.requestId ?? payload.resourceReference?.resourceURL ?? null;
      } catch {
        providerMessageId = null;
      }

      return {
        status: 'sent',
        providerMessageId,
      } satisfies DeliveryResult;
    } catch (error) {
      return {
        status: 'failed',
        errorMessage: getApplicationErrorMessage(error, '') || 'MTN SMS request failed',
      } satisfies DeliveryResult;
    }
  }

  if (key === 'mnotify')
    return sendMnotifySms({ config: cfg, recipient: to, message: body, smsType });

  return {
    status: 'failed',
    errorMessage: `Unsupported SMS provider key: ${provider.providerKey}`,
  } satisfies DeliveryResult;
}
