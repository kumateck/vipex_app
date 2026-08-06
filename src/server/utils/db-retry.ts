import { ServiceUnavailable } from './http-error';

type RetryOptions = {
  attempts?: number;
  baseDelayMs?: number;
  operationName?: string;
};

function getErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const asRecord = error as Record<string, unknown>;
  const direct = asRecord.code;
  if (typeof direct === 'string') return direct;

  const cause = asRecord.cause;
  if (cause && typeof cause === 'object') {
    const nested = (cause as Record<string, unknown>).code;
    if (typeof nested === 'string') return nested;
  }

  return null;
}

function isTransientDatabaseError(error: unknown): boolean {
  const code = getErrorCode(error);
  if (!code) return false;

  const transientCodes = new Set([
    'CONNECTION_CLOSED',
    'CONNECTION_ENDED',
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    '57P01', // admin_shutdown
    '57P02', // crash_shutdown
    '57P03', // cannot_connect_now
  ]);

  return transientCodes.has(code);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withDbRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = Math.max(1, options.attempts ?? 3);
  const baseDelayMs = Math.max(100, options.baseDelayMs ?? 250);

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientDatabaseError(error) || attempt >= attempts) break;
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }

  if (isTransientDatabaseError(lastError)) {
    throw ServiceUnavailable(
      `${options.operationName ?? 'Database operation'} is temporarily unavailable. Please retry.`,
    );
  }

  throw lastError;
}
