import { toMsisdn } from '@/server/utils/phone-msisdn';
import type { DeliveryResult } from '../types';
import {
  buildWhatsAppTemplatePayload,
  resolveWhatsAppConfig,
  type WhatsAppTemplateMessage,
} from './whatsapp-payloads';

const GRAPH_API_ROOT = 'https://graph.facebook.com';
const REQUEST_TIMEOUT_MS = 15_000;

function safeError(value: string, accessToken: string) {
  return (accessToken ? value.replaceAll(accessToken, '[REDACTED]') : value).slice(0, 500);
}

export async function sendWhatsAppTemplate(
  input: {
    config: unknown;
    recipient: string;
    message: WhatsAppTemplateMessage;
  },
  request: typeof fetch = fetch,
): Promise<DeliveryResult> {
  const config = resolveWhatsAppConfig(input.config);
  if (!config.accessToken || !config.phoneNumberId) {
    return {
      status: 'failed',
      errorMessage: 'WhatsApp provider is missing configuration (accessToken/phoneNumberId)',
    };
  }
  const to = toMsisdn(input.recipient);
  if (!to) {
    return { status: 'failed', errorMessage: `Invalid WhatsApp number: ${input.recipient}` };
  }
  if (!input.message.templateName) {
    return { status: 'failed', errorMessage: 'WhatsApp template name is not configured' };
  }

  try {
    const response = await request(
      `${GRAPH_API_ROOT}/${config.apiVersion}/${encodeURIComponent(config.phoneNumberId)}/messages`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${config.accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(buildWhatsAppTemplatePayload(to, input.message)),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );

    let payload: {
      messages?: Array<{ id?: unknown }>;
      error?: { message?: unknown; code?: unknown };
    } | null = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok || payload?.error) {
      const detail =
        typeof payload?.error?.message === 'string'
          ? payload.error.message
          : 'No error detail returned';
      return {
        status: 'failed',
        errorMessage: safeError(
          `WhatsApp API returned ${response.status} (code ${String(payload?.error?.code ?? 'n/a')}): ${detail}`,
          config.accessToken,
        ),
      };
    }

    const messageId = payload?.messages?.[0]?.id;
    if (typeof messageId !== 'string' || !messageId) {
      return {
        status: 'failed',
        errorMessage: 'WhatsApp API did not return a message id; delivery acceptance unknown',
      };
    }
    return { status: 'sent', providerMessageId: messageId };
  } catch (error) {
    const err = error as Error;
    const message =
      err.name === 'AbortError' || err.name === 'TimeoutError'
        ? 'WhatsApp request timed out; delivery acceptance could not be confirmed'
        : `WhatsApp request failed: ${err.message || 'Unknown transport error'}`;
    return { status: 'failed', errorMessage: safeError(message, config.accessToken) };
  }
}
