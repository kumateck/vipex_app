import { createHash } from 'node:crypto';

/** One error as Oryx Monitor's ingest endpoint expects it (see oryx-monitor server/ingest/contract.ts). */
export type MonitorEvent = {
  id: string;
  occurredAt: string;
  level?: string | null;
  source?: string | null;
  category?: string | null;
  message?: string | null;
  exceptionType?: string | null;
  exceptionDetails?: string | null;
  fingerprint?: string | null;
  traceId?: string | null;
  statusCode?: number | null;
  httpMethod?: string | null;
  path?: string | null;
  routeTemplate?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  ipAddress?: string | null;
  elapsedMs?: number | null;
  release?: string | null;
  instance?: string | null;
  machineName?: string | null;
};

export type RequestErrorContext = {
  statusCode?: number;
  method?: string;
  path?: string;
  route?: string;
  traceId?: string;
  userId?: string | null;
  userEmail?: string | null;
  ipAddress?: string | null;
  elapsedMs?: number | null;
  category?: string;
};

const MAX_MESSAGE = 4_000;
const MAX_DETAILS = 32_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SQL_PARAMS = /\nparams:[\s\S]*$/;

const truncate = (value: string, max: number) =>
  value.length <= max ? value : value.slice(0, max);

/** Drizzle puts bind parameters (customer data) after "params:"; never send them. */
export const sanitizeMessage = (message: string) =>
  truncate(message.replace(SQL_PARAMS, ''), MAX_MESSAGE);

/** Follows `cause` links to the root error, like the .NET client's innermost exception. */
export function errorChain(error: unknown): Error[] {
  const chain: Error[] = [];
  let current: unknown = error;
  while (current instanceof Error && chain.length < 5 && !chain.includes(current)) {
    chain.push(current);
    current = current.cause;
  }
  return chain;
}

export const errorType = (error: Error) =>
  error.name && error.name !== 'Error' ? error.name : error.constructor?.name || 'Error';

const stackFrames = (error: Error) =>
  (error.stack ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('at '));

// Numbers, UUIDs and cuids / codes like "VPX20240101"; short words such as "v1" stay.
const isIdLike = (segment: string) =>
  /^\d+$/.test(segment) ||
  UUID.test(segment) ||
  (segment.length >= 8 && /\d/.test(segment) && /^[\w-]+$/.test(segment));

/** Replaces ids and numbers so the same failure on different records groups together. */
export function normalizePath(path: string): string {
  return path
    .split('?')[0]!
    .split('/')
    .map((segment) => (isIdLike(segment) ? ':id' : segment))
    .join('/');
}

/** First frame in our own code (not node_modules), with line/column numbers and absolute paths removed. */
export function topFrame(error: Error): string {
  const frames = stackFrames(error);
  const frame =
    frames.find((f) => !f.includes('node_modules') && !f.includes('native')) ?? frames[0];
  if (!frame) return '';
  return frame
    .replace(/\(?(?:file:\/\/)?\/[^\s()]*?\/(src|backend|node_modules)\//, '$1/')
    .replace(/:\d+(:\d+)?\)?$/, '')
    .replace(/[()]/g, '')
    .replace(/\d+/g, '');
}

/** Same failure → same fingerprint: root exception type + route + top stack frame, with no ids or numbers. */
export function computeFingerprint(exceptionType: string, route: string, frame: string): string {
  const key = `${exceptionType}|${normalizePath(route)}|${frame.replace(/\d+/g, '')}`;
  return createHash('sha256').update(key).digest('hex').slice(0, 16);
}

function describeChain(chain: Error[]): string {
  return truncate(
    chain
      .map((e, i) => {
        const header = `${i === 0 ? '' : 'Caused by: '}${errorType(e)}: ${sanitizeMessage(e.message)}`;
        return [header, ...stackFrames(e).map((f) => `    ${f}`)].join('\n');
      })
      .join('\n'),
    MAX_DETAILS,
  );
}

/** Builds a monitor event from anything that was thrown. Never throws. */
export function buildErrorEvent(error: unknown, context: RequestErrorContext = {}): MonitorEvent {
  const chain = errorChain(error);
  const root = chain.at(-1);
  const outer = chain[0];
  const exceptionType = root ? errorType(root) : typeof error;
  const message = outer
    ? sanitizeMessage(outer.message || exceptionType)
    : sanitizeMessage(String(error));
  const route = context.route || context.path || '';
  const userId = context.userId && UUID.test(context.userId) ? context.userId : null;

  return {
    id: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    level: 'Error',
    source: 'vipex-api',
    category: context.category ?? (context.method ? 'http' : 'process'),
    message,
    exceptionType,
    exceptionDetails: chain.length ? describeChain(chain) : null,
    fingerprint: computeFingerprint(exceptionType, route, root ? topFrame(root) : ''),
    traceId: context.traceId ?? null,
    statusCode: context.statusCode ?? null,
    httpMethod: context.method ?? null,
    path: context.path ? context.path.split('?')[0] : null,
    routeTemplate: context.route ?? null,
    // The monitor only accepts UUID user ids; vipex ids are cuids, so those go by email only.
    userId,
    userEmail: context.userEmail ?? null,
    ipAddress: context.ipAddress ?? null,
    elapsedMs: context.elapsedMs ?? null,
  };
}
