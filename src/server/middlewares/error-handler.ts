import type { Elysia } from 'elysia';
import { isHttpError } from '../utils/http-error';

// Optional: Detect common DB/SMTP errors and map to HTTP statuses
function toHttpStatus(err: { code?: string; command?: string }): {
  status: number;
  reason?: string;
} {
  // Postgres unique violation
  if (err?.code === '23505') return { status: 409, reason: 'unique_violation' };
  // Postgres foreign key violation
  if (err?.code === '23503') return { status: 409, reason: 'foreign_key_violation' };
  // SMTP connection issues (surface as 502/503)
  if (err?.code === 'ESOCKET' || err?.command === 'CONN')
    return { status: 502, reason: 'smtp_connect' };
  return { status: 500 };
}

export function errorHandler(app: Elysia) {
  return app.onError(({ code, error, set, request }) => {
    // Known framework codes
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return {
        error: { message: 'Route not found', status: 404, path: new URL(request.url).pathname },
      };
    }

    if (code === 'VALIDATION') {
      // Elysia validation error
      set.status = 400;
      return {
        error: {
          message: 'Validation failed',
          status: 400,
          // Elysia’s error can carry detail under error.all or error.cause; we include message fallback
          details: error?.all ?? error?.cause ?? String(error?.message || ''),
        },
      };
    }

    // Our custom HttpError
    if (isHttpError(error)) {
      const err = error as { status: number; message: string; details?: unknown };
      set.status = error.status;
      return {
        error: {
          message: err.message,
          status: err.status,
          details: err.details ?? undefined,
        },
      };
    }

    // Heuristic mapping for known infra errors (DB/SMTP), otherwise 500
    const { status, reason } = toHttpStatus(
      error as unknown as { code?: string; command?: string },
    );
    set.status = status;
    const err = error as { message?: string; details?: unknown };
    return {
      error: {
        message: status >= 500 ? 'Internal Server Error' : err?.message || 'Request failed',
        status,
        reason,
      },
    };
  });
}
