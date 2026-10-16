import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '@/server/utils/env';

export const WHATSAPP_PROVIDER_KEY = 'meta_cloud';
export const WHATSAPP_SECRET_KEYS = ['accessToken', 'appSecret', 'webhookVerifyToken'] as const;

export type WhatsAppConfig = {
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
  apiVersion: string;
  appSecret: string;
  webhookVerifyToken: string;
};

/** A business-initiated message: Meta only delivers pre-approved templates. */
export type WhatsAppTemplateMessage = {
  templateName: string;
  language: string;
  bodyParams: string[];
  /** Dynamic suffix for a URL button (or the code for an OTP copy-code button). */
  buttonUrlParam?: string | null;
};

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export function resolveWhatsAppConfig(configJson: unknown): WhatsAppConfig {
  const config =
    configJson && typeof configJson === 'object' ? (configJson as Record<string, unknown>) : {};
  return {
    accessToken: text(config.accessToken) || text(env.WHATSAPP_ACCESS_TOKEN),
    phoneNumberId: text(config.phoneNumberId) || text(env.WHATSAPP_PHONE_NUMBER_ID),
    wabaId: text(config.wabaId),
    apiVersion: text(config.apiVersion) || text(env.WHATSAPP_API_VERSION) || 'v21.0',
    appSecret: text(config.appSecret) || text(env.WHATSAPP_APP_SECRET),
    webhookVerifyToken: text(config.webhookVerifyToken) || text(env.WHATSAPP_WEBHOOK_VERIFY_TOKEN),
  };
}

export function isWhatsAppConfigured(configJson: unknown) {
  const config = resolveWhatsAppConfig(configJson);
  return Boolean(config.accessToken && config.phoneNumberId);
}

export function buildWhatsAppTemplatePayload(to: string, message: WhatsAppTemplateMessage) {
  const components: Array<Record<string, unknown>> = [];
  if (message.bodyParams.length) {
    components.push({
      type: 'body',
      parameters: message.bodyParams.map((value) => ({ type: 'text', text: value })),
    });
  }
  if (message.buttonUrlParam) {
    components.push({
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: message.buttonUrlParam }],
    });
  }
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name: message.templateName,
      language: { code: message.language },
      ...(components.length ? { components } : {}),
    },
  };
}

/** Verifies Meta's `X-Hub-Signature-256: sha256=<hex>` header over the raw body. */
export function verifyWhatsAppSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  appSecret: string,
) {
  if (!appSecret || !signatureHeader?.startsWith('sha256=')) return false;
  const received = Buffer.from(signatureHeader.slice('sha256='.length), 'hex');
  const expected = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest();
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/** Replaces secret values with a fixed mask so config can be shown to staff safely. */
export function maskWhatsAppConfig(configJson: unknown) {
  if (!configJson || typeof configJson !== 'object') return configJson;
  const masked: Record<string, unknown> = { ...(configJson as Record<string, unknown>) };
  for (const key of WHATSAPP_SECRET_KEYS) {
    if (text(masked[key])) masked[key] = '••••••••';
  }
  return masked;
}
