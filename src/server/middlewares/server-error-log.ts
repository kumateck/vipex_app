import { isProd } from '../utils/env';
import { HttpStatus } from '../utils/http-status';
import type { ErrorDetails } from '../utils/http-error';
import { logger } from '../utils/logger';

type ServerErrorContext = {
  status: number;
  requestId: string;
  path: string;
  method: string;
  frameworkCode: string;
  publicCode: string;
  publicMessage: string;
  originalMessage?: string;
  originalCode?: string;
  stack?: string;
  details?: ErrorDetails;
  cause?: unknown;
};

export function buildServerErrorLogRecord(context: ServerErrorContext) {
  if (context.status < HttpStatus.INTERNAL_SERVER_ERROR) return undefined;
  let cause = context.cause;
  let originalCode = context.originalCode;
  const database: Record<string, string> = {};
  const seen = new Set<object>();
  while (cause && typeof cause === 'object' && !seen.has(cause) && seen.size < 5) {
    seen.add(cause);
    const row = cause as Record<string, unknown>;
    if (typeof row.code === 'string') originalCode = row.code.slice(0, 64);
    // Explicitly exclude SQL, bind parameters, key values, messages and stack traces.
    for (const field of ['schema', 'table', 'column', 'constraint', 'routine']) {
      if (typeof row[field] === 'string') database[field] = row[field].slice(0, 128);
    }
    cause = row.cause;
  }
  return {
    requestId: context.requestId,
    path: context.path.split('?')[0],
    method: context.method,
    status: context.status,
    frameworkCode: context.frameworkCode,
    publicCode: context.publicCode,
    originalCode: originalCode ?? null,
    ...(Object.keys(database).length ? { database } : {}),
  };
}

export function logServerError(context: ServerErrorContext, production = isProd) {
  const record = buildServerErrorLogRecord(context);
  if (!record) return;
  if (production) {
    // Always available in Docker/stdout, even if alert delivery fails or is disabled.
    logger.error('api-server-error', record);
    return;
  }
  let cause: unknown;
  try {
    cause =
      context.cause && typeof context.cause === 'object'
        ? JSON.parse(JSON.stringify(context.cause))
        : null;
  } catch {
    cause = { text: String(context.cause) };
  }
  console.log(
    '[LOCAL_500]',
    JSON.stringify(
      {
        t: new Date().toISOString(),
        ...record,
        publicMessage: context.publicMessage,
        originalMessage: context.originalMessage ?? null,
        details: context.details ?? null,
        stack: context.stack ?? null,
        cause,
      },
      null,
      2,
    ),
  );
}
