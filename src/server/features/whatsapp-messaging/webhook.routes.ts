import { Elysia } from 'elysia';
import { processWhatsAppWebhookSvc, verifyWhatsAppWebhookChallengeSvc } from './webhook.service';

const tags = ['WhatsApp Messaging'];
const path = '/v1/public/whatsapp/webhook';

// Public: Meta calls these. Authenticity comes from the verify token (GET)
// and the X-Hub-Signature-256 HMAC over the raw body (POST).
export const whatsappWebhookRoutes = new Elysia({ name: 'whatsapp-webhook' })
  .get(
    path,
    async ({ query, set }) => {
      const challenge = await verifyWhatsAppWebhookChallengeSvc(
        query as Record<string, string | undefined>,
      );
      set.headers['content-type'] = 'text/plain';
      return challenge;
    },
    { detail: { tags, summary: 'WhatsApp webhook subscription verification' } },
  )
  .post(
    path,
    async ({ request }) =>
      processWhatsAppWebhookSvc(await request.text(), request.headers.get('x-hub-signature-256')),
    {
      // Keep the raw body: the signature is computed over the exact bytes Meta sent.
      parse: 'none',
      detail: { tags, summary: 'WhatsApp delivery status webhook' },
    },
  );
