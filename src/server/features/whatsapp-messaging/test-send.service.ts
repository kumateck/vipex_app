import { BadRequest } from '@/server/utils/http-error';
import { sendWhatsAppTemplate } from '../notification-hub/providers';
import { resolveWhatsAppTemplateSvc } from '../notification-hub/services/whatsapp-events.service';
import { findWhatsAppProviderRepo } from './repository';
import {
  DEFAULT_TEST_TARGET,
  HELLO_WORLD_TEST_MESSAGE,
  HELLO_WORLD_TEST_TARGET,
  buildWhatsAppTestMessage,
} from './test-message';

/**
 * Sends one of the company's application templates (filled with sample values)
 * to confirm credentials and template approval end to end. `hello_world` is
 * still available for Meta's public test numbers. Nothing is written to the
 * dispatch log.
 */
export async function sendWhatsAppTestSvc(input: {
  companyId: string;
  phone: string;
  template?: string;
}) {
  const provider = await findWhatsAppProviderRepo(input.companyId);
  if (!provider) throw BadRequest('Save the WhatsApp provider settings first');

  const target = input.template?.trim() || DEFAULT_TEST_TARGET;
  let message = HELLO_WORLD_TEST_MESSAGE;
  if (target !== HELLO_WORLD_TEST_TARGET) {
    const resolved = await resolveWhatsAppTemplateSvc(input.companyId, target);
    if (!resolved) throw BadRequest('Unknown WhatsApp test template');
    message = buildWhatsAppTestMessage(resolved);
  }

  const result = await sendWhatsAppTemplate({
    config: provider.configJson,
    recipient: input.phone,
    message,
  });
  if (result.status !== 'sent') throw BadRequest(result.errorMessage ?? 'WhatsApp test failed');
  return {
    providerMessageId: result.providerMessageId ?? null,
    templateName: message.templateName,
    language: message.language,
  };
}
