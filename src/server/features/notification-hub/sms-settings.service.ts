import { notificationProviders } from '@/db/schemas';
import { env } from '@/server/utils/env';
import { BadRequest, Conflict } from '@/server/utils/http-error';
import { recordAuditLog } from '../audit/logger';
import { createNotificationProviderRepo, listNotificationProvidersRepo } from './repository';
import { setDefaultNotificationProviderSvc } from './service';
import { SMS_EVENT_DEFINITIONS, getSmsEventDefinition } from './sms-event-definitions';
import { findSmsEventTemplateRepo, upsertSmsEventTemplateRepo } from './sms-settings.repository';

type Provider = Awaited<ReturnType<typeof listNotificationProvidersRepo>>['data'][number];
type SmsProviderOption = {
  providerKey: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  isConfigured: boolean;
  configurationSource: 'provider' | 'environment';
};

function objectConfig(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function hasText(config: Record<string, unknown>, key: string) {
  return typeof config[key] === 'string' && Boolean(config[key].trim());
}

function isProviderConfigured(providerKey: string, configJson: unknown) {
  const key = providerKey.toLowerCase();
  const config = objectConfig(configJson);
  if (key === 'log_only') return true;
  if (key === 'custom_webhook') return hasText(config, 'url');
  if (key === 'mnotify') {
    return Boolean(
      (hasText(config, 'apiKey') || env.MNOTIFY_API_KEY) &&
        (hasText(config, 'senderId') || env.MNOTIFY_SENDER_ID) &&
        (hasText(config, 'apiUrl') || env.MNOTIFY_API_URL),
    );
  }
  if (key === 'mtn') {
    return Boolean(
      (hasText(config, 'subscriptionKey') || env.MTN_SMS_DEFAULT_SUBSCRIPTION_KEY) &&
        hasText(config, 'senderId') &&
        (hasText(config, 'apiUrl') || env.MTN_SMS_API_BASE_URL),
    );
  }
  return false;
}

function toProviderOption(provider: Provider): SmsProviderOption {
  return {
    providerKey: provider.providerKey,
    name: provider.name,
    isActive: provider.isActive,
    isDefault: provider.isDefault && provider.isActive,
    isConfigured: isProviderConfigured(provider.providerKey, provider.configJson),
    configurationSource: 'provider' as const,
  };
}

async function getSmsProviderOptions(companyId: string) {
  const result = await listNotificationProvidersRepo({
    companyId,
    channel: 'sms',
    limit: 100,
    offset: 0,
  });
  const options: SmsProviderOption[] = result.data.map(toProviderOption);
  const hasMnotify = options.some((provider) => provider.providerKey.toLowerCase() === 'mnotify');
  if (!hasMnotify && isProviderConfigured('mnotify', null)) {
    options.push({
      providerKey: 'mnotify',
      name: 'mNotify',
      isActive: true,
      isDefault: false,
      isConfigured: true,
      configurationSource: 'environment',
    });
  }
  return options.sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name),
  );
}

export async function getCompanySmsSettingsSvc(companyId: string) {
  const [providers, templates] = await Promise.all([
    getSmsProviderOptions(companyId),
    Promise.all(
      SMS_EVENT_DEFINITIONS.map((definition) =>
        findSmsEventTemplateRepo(companyId, definition.code),
      ),
    ),
  ]);

  return {
    defaultProviderKey: providers.find((provider) => provider.isDefault)?.providerKey ?? null,
    providers,
    events: SMS_EVENT_DEFINITIONS.map((definition, index) => {
      const template = templates[index];
      return {
        ...definition,
        body: template?.isActive ? template.body : definition.defaultBody,
        isCustomized: Boolean(template?.isActive),
      };
    }),
  };
}

export async function setCompanyDefaultSmsProviderSvc(input: {
  companyId: string;
  actorUserId: string;
  providerKey: string;
}) {
  const providerKey = input.providerKey.trim().toLowerCase();
  const options = await getSmsProviderOptions(input.companyId);
  const option = options.find((provider) => provider.providerKey.toLowerCase() === providerKey);
  if (!option) throw BadRequest('SMS provider is not available for this company');
  if (!option.isConfigured) throw BadRequest('SMS provider configuration is incomplete');

  const existing = (
    await listNotificationProvidersRepo({
      companyId: input.companyId,
      channel: 'sms',
      limit: 100,
      offset: 0,
    })
  ).data.find((provider) => provider.providerKey.toLowerCase() === providerKey);

  const provider =
    existing ??
    (await createNotificationProviderRepo({
      companyId: input.companyId,
      createdBy: input.actorUserId,
      channel: 'sms',
      providerKey,
      name: option.name,
      configJson: null,
      isActive: true,
      isDefault: false,
    } satisfies typeof notificationProviders.$inferInsert));
  if (!provider) throw Conflict('Failed to enable SMS provider');

  await setDefaultNotificationProviderSvc({
    id: provider.id,
    companyId: input.companyId,
    actorUserId: input.actorUserId,
  });
  return { providerKey };
}

const TEMPLATE_VARIABLE_PATTERN = /{{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*}}/g;

export async function updateCompanySmsEventSvc(input: {
  companyId: string;
  actorUserId: string;
  eventCode: string;
  body: string;
}) {
  const definition = getSmsEventDefinition(input.eventCode);
  if (!definition) throw BadRequest('Unknown application SMS event');
  const body = input.body.trim();
  if (!body) throw BadRequest('SMS message body is required');

  const allowedVariables = new Set(definition.variables);
  const usedVariables = [...body.matchAll(TEMPLATE_VARIABLE_PATTERN)].flatMap((match) =>
    match[1] ? [match[1]] : [],
  );
  const unknownVariables = [...new Set(usedVariables.filter((key) => !allowedVariables.has(key)))];
  if (unknownVariables.length) {
    throw BadRequest(`Unknown SMS variables: ${unknownVariables.join(', ')}`);
  }

  const template = await upsertSmsEventTemplateRepo({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    code: definition.code,
    name: definition.name,
    body,
    variables: definition.variables,
  });
  if (!template) throw Conflict('Failed to save SMS definition');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'notification_template',
    entityId: template.id,
    action: 'APPLICATION_SMS_DEFINITION_UPDATED',
    message: `Application SMS definition updated: ${definition.name}`,
    metadata: { eventCode: definition.code, usedVariables },
  });
  return { id: template.id, eventCode: definition.code };
}
