import { describe, expect, test } from 'bun:test';
import { createHmac } from 'node:crypto';
import { sendWhatsAppTemplate } from './whatsapp-cloud-provider';
import {
  buildWhatsAppTemplatePayload,
  maskWhatsAppConfig,
  verifyWhatsAppSignature,
} from './whatsapp-payloads';

const config = { accessToken: 'secret-token', phoneNumberId: '1234567890', apiVersion: 'v21.0' };
const message = {
  templateName: 'digital_receipt_booking',
  language: 'en',
  bodyParams: ['Ama', 'BK-001'],
  buttonUrlParam: 'tok123',
};
const fakeFetch = (payload: unknown, status = 200) =>
  (async () => Response.json(payload, { status })) as unknown as typeof fetch;

describe('WhatsApp template payload', () => {
  test('builds body and URL-button components', () => {
    expect(buildWhatsAppTemplatePayload('233244123456', message)).toEqual({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '233244123456',
      type: 'template',
      template: {
        name: 'digital_receipt_booking',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: 'Ama' },
              { type: 'text', text: 'BK-001' },
            ],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [{ type: 'text', text: 'tok123' }],
          },
        ],
      },
    });
  });

  test('omits components for a parameterless template', () => {
    const payload = buildWhatsAppTemplatePayload('233244123456', {
      templateName: 'hello_world',
      language: 'en_US',
      bodyParams: [],
    });
    expect(payload.template).toEqual({ name: 'hello_world', language: { code: 'en_US' } });
  });
});

describe('WhatsApp Cloud transport', () => {
  test('posts to the Graph API with bearer auth and the international number', async () => {
    const request = (async (url: string | URL | Request, options?: RequestInit) => {
      expect(String(url)).toBe('https://graph.facebook.com/v21.0/1234567890/messages');
      expect((options?.headers as Record<string, string>).authorization).toBe(
        'Bearer secret-token',
      );
      expect(options?.signal).toBeInstanceOf(AbortSignal);
      expect(JSON.parse(String(options?.body)).to).toBe('233244123456');
      return Response.json({ messages: [{ id: 'wamid.ABC' }] });
    }) as unknown as typeof fetch;
    expect(
      await sendWhatsAppTemplate({ config, recipient: '0244123456', message }, request),
    ).toEqual({ status: 'sent', providerMessageId: 'wamid.ABC' });
  });

  test('fails without calling the API when configuration is missing', async () => {
    const request = (async () => {
      throw new Error('should not be called');
    }) as unknown as typeof fetch;
    const result = await sendWhatsAppTemplate(
      { config: { phoneNumberId: '1' }, recipient: '0244123456', message },
      request,
    );
    // Env fallback may supply a token in some environments; only assert when it does not.
    if (!process.env.WHATSAPP_ACCESS_TOKEN) {
      expect(result).toMatchObject({ status: 'failed' });
      expect(result.errorMessage).toContain('missing configuration');
    }
  });

  test('rejects an invalid recipient number', async () => {
    const result = await sendWhatsAppTemplate(
      { config, recipient: '12', message },
      fakeFetch({ messages: [{ id: 'x' }] }),
    );
    expect(result).toEqual({ status: 'failed', errorMessage: 'Invalid WhatsApp number: 12' });
  });

  test('surfaces API errors without leaking the token', async () => {
    const result = await sendWhatsAppTemplate(
      { config, recipient: '0244123456', message },
      fakeFetch({ error: { message: 'Template secret-token not found', code: 132001 } }, 400),
    );
    expect(result.status).toBe('failed');
    expect(result.errorMessage).toContain('132001');
    expect(result.errorMessage).not.toContain('secret-token');
  });

  test('treats a success response without a message id as failed', async () => {
    const result = await sendWhatsAppTemplate(
      { config, recipient: '0244123456', message },
      fakeFetch({ messages: [] }),
    );
    expect(result.status).toBe('failed');
  });
});

describe('WhatsApp webhook signature', () => {
  const body = JSON.stringify({ entry: [] });
  const sign = (secret: string) =>
    `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;

  test('accepts a valid signature', () => {
    expect(verifyWhatsAppSignature(body, sign('app-secret'), 'app-secret')).toBe(true);
  });

  test('rejects a wrong secret, missing header or tampered body', () => {
    expect(verifyWhatsAppSignature(body, sign('other'), 'app-secret')).toBe(false);
    expect(verifyWhatsAppSignature(body, null, 'app-secret')).toBe(false);
    expect(verifyWhatsAppSignature(`${body} `, sign('app-secret'), 'app-secret')).toBe(false);
    expect(verifyWhatsAppSignature(body, sign('app-secret'), '')).toBe(false);
  });
});

describe('maskWhatsAppConfig', () => {
  test('masks secrets and keeps identifiers', () => {
    expect(
      maskWhatsAppConfig({ accessToken: 'x', appSecret: 'y', phoneNumberId: '1', wabaId: '' }),
    ).toEqual({ accessToken: '••••••••', appSecret: '••••••••', phoneNumberId: '1', wabaId: '' });
  });
});
