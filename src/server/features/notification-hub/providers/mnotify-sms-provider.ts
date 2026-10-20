import { resolveMnotifyApiRoot } from '../utils';
import { env } from '@/server/utils/env';
import { buildMnotifySmsPayload, type SmsType } from '../sms-provider-payloads';
import type { DeliveryResult } from '../types';

const DEFAULT_API_URL = 'https://api.mnotify.com/api';
const REQUEST_TIMEOUT_MS = 15_000;
const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

function safeError(value: string, apiKey: string) {
  return value
    .replaceAll(apiKey, '[REDACTED]')
    .replaceAll(encodeURIComponent(apiKey), '[REDACTED]')
    .replace(/([?&]key=)[^\s&"']+/gi, '$1[REDACTED]')
    .slice(0, 500);
}

async function getHttpError(response: Response, apiKey: string) {
  if (response.status >= 500) {
    return `mNotify service error (HTTP ${response.status}). Delivery acceptance could not be confirmed. Check mNotify delivery reports before retrying.`;
  }
  let detail = '';
  try {
    const payload = await response.json();
    detail = text(payload?.message);
  } catch {
    // HTML error pages are not useful delivery diagnostics and may contain scripts.
  }
  return safeError(
    `mNotify API returned ${response.status}: ${detail || 'No JSON error details returned. Check the provider configuration or contact mNotify support.'}`,
    apiKey,
  );
}

export async function sendMnotifySms(
  input: {
    config: Record<string, unknown>;
    recipient: string;
    message: string;
    smsType?: SmsType;
  },
  request: typeof fetch = fetch,
): Promise<DeliveryResult> {
  const apiKey = text(input.config.apiKey) || text(env.MNOTIFY_API_KEY);
  const senderId = text(input.config.senderId) || text(env.MNOTIFY_SENDER_ID);
  const configuredUrl = text(input.config.apiUrl) || text(env.MNOTIFY_API_URL) || DEFAULT_API_URL;
  if (!apiKey || !senderId)
    return {
      status: 'failed',
      errorMessage: 'mNotify provider is missing configuration (apiKey/senderId)',
    };
  if (senderId.length > 11)
    return { status: 'failed', errorMessage: 'mNotify sender ID must be at most 11 characters' };
  try {
    const url = new URL(`${resolveMnotifyApiRoot(configuredUrl)}/sms/quick`);
    url.searchParams.set('key', apiKey);
    const response = await request(url.toString(), {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(
        buildMnotifySmsPayload({
          recipient: input.recipient,
          sender: senderId,
          message: input.message,
          smsType: input.smsType,
        }),
      ),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok)
      return {
        status: 'failed',
        errorMessage: await getHttpError(response, apiKey),
      };
    let payload: {
      code?: unknown;
      status?: unknown;
      message?: unknown;
      summary?: { _id?: unknown; total_sent?: unknown; total_rejected?: unknown };
    };
    try {
      payload = await response.json();
    } catch {
      return { status: 'failed', errorMessage: 'mNotify returned an invalid JSON acknowledgement' };
    }
    if (
      !payload ||
      String(payload.code ?? '') !== '2000' ||
      (payload.status !== undefined && payload.status !== 'success')
    ) {
      return {
        status: 'failed',
        errorMessage: safeError(
          `mNotify rejected the message (code ${String(payload?.code ?? 'missing')}): ${text(payload?.message) || 'No valid success acknowledgement'}`,
          apiKey,
        ),
      };
    }
    if (payload.summary?.total_sent !== undefined && !(Number(payload.summary.total_sent) > 0)) {
      return {
        status: 'failed',
        errorMessage: 'mNotify did not accept the recipient (total_sent is zero)',
      };
    }
    return { status: 'sent', providerMessageId: text(payload.summary?._id) || null };
  } catch (error) {
    const err = error as Error;
    const message =
      err.name === 'AbortError' || err.name === 'TimeoutError'
        ? 'mNotify request timed out; delivery acceptance could not be confirmed'
        : `mNotify request failed: ${err.message || 'Unknown transport error'}`;
    return { status: 'failed', errorMessage: safeError(message, apiKey) };
  }
}
