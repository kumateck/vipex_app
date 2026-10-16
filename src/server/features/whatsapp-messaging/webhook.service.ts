import { Forbidden } from '@/server/utils/http-error';
import { env } from '@/server/utils/env';
import { resolveWhatsAppConfig, verifyWhatsAppSignature } from '../notification-hub/providers';
import { updateNotificationDispatchResultRepo } from '../notification-hub/repository';
import {
  findWhatsAppDispatchByMessageIdRepo,
  findWhatsAppProviderByPhoneNumberIdRepo,
  findWhatsAppProviderByVerifyTokenRepo,
} from './repository';
import { extractWhatsAppStatusUpdates, nextDispatchStatus } from './webhook-status';

/** Meta's subscription handshake: echo `hub.challenge` when the verify token matches. */
export async function verifyWhatsAppWebhookChallengeSvc(query: Record<string, string | undefined>) {
  const token = query['hub.verify_token'] ?? '';
  if (query['hub.mode'] !== 'subscribe' || !token) throw Forbidden('Invalid webhook verification');

  const envToken = env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim();
  if (envToken && token === envToken) return query['hub.challenge'] ?? '';

  // Company-configured tokens: the subscription is per Meta app, so any match is accepted.
  const match = await findWhatsAppProviderByVerifyTokenRepo(token);
  if (!match) throw Forbidden('Invalid webhook verification');
  return query['hub.challenge'] ?? '';
}

export async function processWhatsAppWebhookSvc(rawBody: string, signature: string | null) {
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    throw Forbidden('Invalid webhook payload');
  }

  const updates = extractWhatsAppStatusUpdates(payload);
  const phoneNumberId = updates.find((update) => update.phoneNumberId)?.phoneNumberId ?? null;
  const provider = phoneNumberId
    ? await findWhatsAppProviderByPhoneNumberIdRepo(phoneNumberId)
    : null;
  const appSecret = resolveWhatsAppConfig(provider?.configJson ?? null).appSecret;
  // Signature is checked before any write, against the matching company's secret.
  if (!verifyWhatsAppSignature(rawBody, signature, appSecret)) {
    throw Forbidden('Invalid webhook signature');
  }

  let applied = 0;
  for (const update of updates) {
    const dispatch = await findWhatsAppDispatchByMessageIdRepo(update.providerMessageId);
    if (!dispatch) continue;
    if (provider && dispatch.companyId !== provider.companyId) continue;
    const status = nextDispatchStatus(dispatch.status, update.status);
    if (!status) continue;
    await updateNotificationDispatchResultRepo(dispatch.id, dispatch.companyId, {
      status,
      ...(status === 'failed' ? { errorMessage: update.errorMessage } : {}),
    });
    applied++;
  }
  return { received: updates.length, applied };
}
