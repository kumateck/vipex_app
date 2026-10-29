import { Elysia, StatusMap } from 'elysia';
import type { RequestErrorContext } from './event';
import { reportError } from './index';

/** The parts of an Elysia hook context the reporter reads; all optional except the request. */
export type ReportableContext = {
  request: Request;
  route?: unknown;
  set?: { status?: unknown; headers?: Record<string, unknown> };
  user?: { sub?: string | null; email?: string | null } | null;
  _start?: unknown;
};

// Requests already reported from the error handler, so the 5xx hook doesn't report them twice.
const reported = new WeakSet<Request>();

const statusOf = (value: unknown): number | undefined => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return (StatusMap as Record<string, number>)[value];
  return undefined;
};

export function requestErrorContext(
  ctx: ReportableContext,
  statusCode: number,
  traceId?: string,
): RequestErrorContext {
  const { request } = ctx;
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const headerId = ctx.set?.headers?.['x-request-id'];
  return {
    statusCode,
    method: request.method,
    path: new URL(request.url).pathname,
    route: typeof ctx.route === 'string' && ctx.route ? ctx.route : undefined,
    traceId:
      traceId ??
      request.headers.get('x-request-id') ??
      (typeof headerId === 'string' ? headerId : undefined),
    userId: ctx.user?.sub ?? null,
    userEmail: ctx.user?.email ?? null,
    ipAddress: forwarded || request.headers.get('x-real-ip') || null,
    elapsedMs: typeof ctx._start === 'number' ? Math.round(performance.now() - ctx._start) : null,
  };
}

/** Reports a failed (5xx) request. Called by the global error handler with the thrown error. */
export function reportRequestError(
  ctx: ReportableContext,
  error: unknown,
  statusCode: number,
  traceId?: string,
): void {
  try {
    if (statusCode < 500) return;
    reported.add(ctx.request);
    reportError(error, requestErrorContext(ctx, statusCode, traceId));
  } catch {
    // Reporting must never break the request.
  }
}

/** Catches 5xx responses that a handler returned without throwing. */
export const errorMonitorPlugin = new Elysia({ name: 'error-monitor' }).onAfterResponse(
  { as: 'global' },
  (ctx) => {
    try {
      const context = ctx as unknown as ReportableContext & { responseValue?: unknown };
      if (reported.has(context.request)) return;
      const status =
        context.responseValue instanceof Response
          ? context.responseValue.status
          : statusOf(context.set?.status);
      if (!status || status < 500) return;
      const error = new Error(`Request failed with HTTP ${status}`);
      error.name = `Http${status}Response`;
      error.stack = `${error.name}: ${error.message}`; // no frames: the route identifies it
      reportRequestError(context, error, status);
    } catch {
      // Reporting must never break the request.
    }
  },
);
