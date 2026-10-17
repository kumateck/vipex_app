import { env } from '@/server/utils/env';
import { BadRequest, Conflict } from '@/server/utils/http-error';
import { recordAuditLog } from '../audit/logger';
import {
  WHATSAPP_PROVIDER_KEY,
  resolveWhatsAppConfig,
  sendWhatsAppTemplate,
} from '../notification-hub/providers';
import {
  clearDefaultProviderByChannelRepo,
  createNotificationProviderRepo,
  updateNotificationProviderRepo,
} from '../notification-hub/repository';
import {
  WHATSAPP_EVENT_DEFINITIONS,
  getWhatsAppEventDefinition,
} from '../notification-hub/whatsapp-event-definitions';
import { getWhatsAppAvailabilitySvc } from './availability.service';
import {
  findWhatsAppProviderRepo,
  listWhatsAppTemplateOverridesRepo,
  upsertWhatsAppTemplateOverrideRepo,
} from './repository';

const TEMPLATE_NAME_PATTERN = /^[a-z0-9_]{1,512}$/;
const LANGUAGE_PATTERN = /^[a-z]{2,3}(_[A-Z]{2})?$/;
const objectConfig = (value: unknown) =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

export async function getWhatsAppSettingsSvc(companyId: string) {
  const [provider, overrides, availability] = await Promise.all([
    findWhatsAppProviderRepo(companyId),
    listWhatsAppTemplateOverridesRepo(companyId),
    getWhatsAppAvailabilitySvc(companyId),
  ]);
  const stored = objectConfig(provider?.configJson);
  const resolved = resolveWhatsAppConfig(provider?.configJson ?? null);
  const overrideByCode = new Map(
    overrides.filter((row) => row.isActive).map((row) => [row.code.toLowerCase(), row]),
  );

  return {
    availability,
    provider: {
      exists: Boolean(provider),
      isActive: provider?.isActive ?? false,
      phoneNumberId: resolved.phoneNumberId,
      wabaId: resolved.wabaId,
      apiVersion: resolved.apiVersion,
      // Secrets are never returned; only whether one is set and where it comes from.
      hasAccessToken: Boolean(resolved.accessToken),
      hasAppSecret: Boolean(resolved.appSecret),
      hasWebhookVerifyToken: Boolean(resolved.webhookVerifyToken),
      accessTokenSource: stored.accessToken
        ? 'provider'
        : resolved.accessToken
          ? 'environment'
          : null,
      updatedAt: provider?.updatedAt?.toISOString() ?? null,
    },
    webhookUrl: `${env.APP_BASE_URL}/v1/public/whatsapp/webhook`,
    events: WHATSAPP_EVENT_DEFINITIONS.map((definition) => {
      const override = overrideByCode.get(definition.code);
      return {
        ...definition,
        templateName: override?.templateName?.trim() || definition.defaultTemplateName,
        language: override?.language?.trim() || definition.defaultLanguage,
        isCustomized: Boolean(override),
      };
    }),
  };
}

export async function saveWhatsAppProviderSvc(input: {
  companyId: string;
  actorUserId: string;
  phoneNumberId: string;
  wabaId?: string;
  apiVersion?: string;
  accessToken?: string;
  appSecret?: string;
  webhookVerifyToken?: string;
  isActive: boolean;
}) {
  const existing = await findWhatsAppProviderRepo(input.companyId);
  const previous = objectConfig(existing?.configJson);
  // Blank secret fields keep the stored value so staff never have to re-enter them.
  const keep = (next: string | undefined, key: string) => next?.trim() || previous[key] || '';
  const configJson = {
    phoneNumberId: input.phoneNumberId.trim(),
    wabaId: input.wabaId?.trim() ?? '',
    apiVersion: input.apiVersion?.trim() || env.WHATSAPP_API_VERSION,
    accessToken: keep(input.accessToken, 'accessToken'),
    appSecret: keep(input.appSecret, 'appSecret'),
    webhookVerifyToken: keep(input.webhookVerifyToken, 'webhookVerifyToken'),
  };

  await clearDefaultProviderByChannelRepo(input.companyId, 'whatsapp');
  const values = { configJson, isActive: input.isActive, isDefault: input.isActive };
  const saved = existing
    ? await updateNotificationProviderRepo(existing.id, input.companyId, {
        ...values,
        updatedAt: new Date(),
      })
    : await createNotificationProviderRepo({
        ...values,
        companyId: input.companyId,
        createdBy: input.actorUserId,
        channel: 'whatsapp',
        providerKey: WHATSAPP_PROVIDER_KEY,
        name: 'WhatsApp Cloud API',
      });
  if (!saved) throw Conflict('Failed to save WhatsApp provider');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'notification_provider',
    entityId: saved.id,
    action: 'WHATSAPP_PROVIDER_SAVED',
    message: 'WhatsApp provider settings saved',
    metadata: {
      phoneNumberId: configJson.phoneNumberId,
      isActive: input.isActive,
      secretsChanged: ['accessToken', 'appSecret', 'webhookVerifyToken'].filter((key) =>
        Boolean((input as Record<string, unknown>)[key]),
      ),
    },
  });
  return { id: saved.id };
}

export async function updateWhatsAppEventTemplateSvc(input: {
  companyId: string;
  actorUserId: string;
  eventCode: string;
  templateName: string;
  language: string;
}) {
  const definition = getWhatsAppEventDefinition(input.eventCode);
  if (!definition) throw BadRequest('Unknown application WhatsApp event');
  const templateName = input.templateName.trim();
  const language = input.language.trim();
  if (!TEMPLATE_NAME_PATTERN.test(templateName)) {
    throw BadRequest('Template name may only contain lowercase letters, digits and underscores');
  }
  if (!LANGUAGE_PATTERN.test(language)) throw BadRequest('Language must look like "en" or "en_US"');

  const saved = await upsertWhatsAppTemplateOverrideRepo({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    code: definition.code,
    name: definition.name,
    templateName,
    language,
    variables: definition.bodyParams,
  });
  if (!saved) throw Conflict('Failed to save WhatsApp template');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'notification_template',
    entityId: saved.id,
    action: 'WHATSAPP_TEMPLATE_UPDATED',
    message: `WhatsApp template updated: ${definition.name}`,
    metadata: { eventCode: definition.code, templateName, language },
  });
  return { id: saved.id, eventCode: definition.code };
}

/** Sends Meta's built-in `hello_world` template to confirm credentials end to end. */
export async function sendWhatsAppTestSvc(input: { companyId: string; phone: string }) {
  const provider = await findWhatsAppProviderRepo(input.companyId);
  if (!provider) throw BadRequest('Save the WhatsApp provider settings first');
  const result = await sendWhatsAppTemplate({
    config: provider.configJson,
    recipient: input.phone,
    message: { templateName: 'hello_world', language: 'en_US', bodyParams: [] },
  });
  if (result.status !== 'sent') throw BadRequest(result.errorMessage ?? 'WhatsApp test failed');
  return { providerMessageId: result.providerMessageId ?? null };
}
