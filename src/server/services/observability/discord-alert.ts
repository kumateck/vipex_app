import { env } from '@/server/utils/env';
import { logger } from '@/server/utils/logger';

type DiscordErrorAlert = {
  status: number;
  requestId: string;
  path: string;
  method: string;
  publicCode: string;
  publicMessage: string;
  frameworkCode: string;
  originalCode?: string;
  originalMessage?: string;
  timestamp: string;
};

const recentAlerts = new Map<string, number>();

const MAX_FIELD_LENGTH = 1024;
const MAX_DESCRIPTION_LENGTH = 4096;

const truncate = (value: string, max: number) => {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
};

const resolveWebhook = (): string | undefined => {
  if (env.APP_ENV === 'production') {
    return env.DISCORD_WEBHOOK_PRODUCTION ?? env.DISCORD_WEBHOOK_URL;
  }

  return env.DISCORD_WEBHOOK_DEVELOPMENT ?? env.DISCORD_WEBHOOK_URL;
};

const signatureOf = (alert: DiscordErrorAlert): string =>
  [alert.status, alert.method, alert.path, alert.publicCode, alert.originalCode].join('|');

const shouldSend = (signature: string): boolean => {
  const now = Date.now();
  const previous = recentAlerts.get(signature);
  if (previous && now - previous < env.DISCORD_ALERT_COOLDOWN_MS) return false;
  recentAlerts.set(signature, now);
  return true;
};

export async function sendDiscordErrorAlert(alert: DiscordErrorAlert): Promise<void> {
  const webhook = resolveWebhook();
  if (!webhook) return;
  if (alert.status < env.DISCORD_ALERT_MIN_STATUS) return;
  if (!shouldSend(signatureOf(alert))) return;

  const isProd = env.APP_ENV === 'production';
  const environmentLabel = isProd ? 'PRODUCTION' : 'DEVELOPMENT';
  const color = isProd ? 15158332 : 15105570;

  const payload = {
    username: `Vipex ${environmentLabel} Alerts`,
    embeds: [
      {
        title: `[${environmentLabel}] API error`,
        description: truncate(
          `${alert.publicCode}: ${alert.publicMessage}`,
          MAX_DESCRIPTION_LENGTH,
        ),
        color,
        fields: [
          { name: 'Status', value: String(alert.status), inline: true },
          { name: 'Method', value: alert.method, inline: true },
          { name: 'Path', value: truncate(alert.path, MAX_FIELD_LENGTH), inline: false },
          { name: 'App Env', value: truncate(env.APP_ENV, MAX_FIELD_LENGTH), inline: true },
          { name: 'Request ID', value: truncate(alert.requestId, MAX_FIELD_LENGTH), inline: false },
          {
            name: 'Framework Code',
            value: truncate(alert.frameworkCode, MAX_FIELD_LENGTH),
            inline: true,
          },
          {
            name: 'Original Code',
            value: truncate(alert.originalCode ?? 'n/a', MAX_FIELD_LENGTH),
            inline: true,
          },
          {
            name: 'Original Message',
            value: truncate(alert.originalMessage ?? 'n/a', MAX_FIELD_LENGTH),
            inline: false,
          },
        ],
        timestamp: alert.timestamp,
      },
    ],
  };

  try {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      logger.warn('discord-alert-failed', {
        status: response.status,
        statusText: response.statusText,
      });
    }
  } catch (error) {
    logger.warn('discord-alert-error', error);
  }
}
