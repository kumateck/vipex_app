import Constants from 'expo-constants';

type MobileErrorReportInput = {
  source: string;
  message: string;
  context?: Record<string, unknown>;
  cause?: unknown;
};

type GlobalErrorHandler = (error: unknown, isFatal?: boolean) => void;

const ERROR_WEBHOOK_ENV = 'EXPO_PUBLIC_DISCORD_ERROR_WEBHOOK_URL';
const ERROR_DEDUPE_WINDOW_MS = 5_000;
const MAX_CONTENT_LENGTH = 1900;

let hasInstalledGlobalHandlers = false;
const lastSentAtByFingerprint = new Map<string, number>();

function truncate(input: string, limit = MAX_CONTENT_LENGTH) {
  return input.length <= limit ? input : `${input.slice(0, limit - 3)}...`;
}

function toSafeJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function toErrorSummary(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? null,
    };
  }
  return { value: String(error) };
}

function getDiscordWebhookUrl() {
  const extra = (Constants.expoConfig?.extra ?? {}) as { discordErrorWebhookUrl?: string };
  const manifestExtra = ((
    Constants as unknown as {
      manifest2?: {
        extra?: { expoClient?: { extra?: { discordErrorWebhookUrl?: string } } };
      };
    }
  ).manifest2?.extra?.expoClient?.extra ?? {}) as { discordErrorWebhookUrl?: string };

  const candidate =
    process.env[ERROR_WEBHOOK_ENV] ??
    extra.discordErrorWebhookUrl ??
    manifestExtra.discordErrorWebhookUrl;
  const normalized = candidate?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

function shouldSkipDuplicate(fingerprint: string) {
  const now = Date.now();
  const last = lastSentAtByFingerprint.get(fingerprint);
  if (last && now - last < ERROR_DEDUPE_WINDOW_MS) return true;
  lastSentAtByFingerprint.set(fingerprint, now);
  return false;
}

function buildDiscordContent(input: MobileErrorReportInput) {
  const payload = {
    at: new Date().toISOString(),
    source: input.source,
    message: input.message,
    context: input.context ?? null,
    cause: input.cause ? toErrorSummary(input.cause) : null,
  };
  return truncate(`**Mobile Error**\n\`\`\`json\n${toSafeJson(payload)}\n\`\`\``);
}

async function postToDiscord(content: string) {
  const webhookUrl = getDiscordWebhookUrl();
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  } catch (reportError) {
    console.error('[mobile-discord] report failed', {
      at: new Date().toISOString(),
      message: reportError instanceof Error ? reportError.message : String(reportError),
    });
  }
}

export function reportMobileErrorToDiscord(input: MobileErrorReportInput) {
  const fingerprint = `${input.source}|${input.message}|${toSafeJson(input.context ?? {})}`;
  if (shouldSkipDuplicate(fingerprint)) return;
  void postToDiscord(buildDiscordContent(input));
}

export function installGlobalMobileErrorHandlers() {
  if (hasInstalledGlobalHandlers) return;
  hasInstalledGlobalHandlers = true;

  const maybeGlobal = globalThis as unknown as {
    ErrorUtils?: {
      getGlobalHandler?: () => GlobalErrorHandler | undefined;
      setGlobalHandler?: (handler: GlobalErrorHandler) => void;
    };
  };
  const errorUtils = maybeGlobal.ErrorUtils;
  if (!errorUtils?.setGlobalHandler) return;

  const existingHandler = errorUtils.getGlobalHandler?.();
  errorUtils.setGlobalHandler((error, isFatal) => {
    reportMobileErrorToDiscord({
      source: 'mobile-global',
      message: 'Unhandled JS error',
      context: { isFatal: Boolean(isFatal) },
      cause: error,
    });
    existingHandler?.(error, isFatal);
  });
}
