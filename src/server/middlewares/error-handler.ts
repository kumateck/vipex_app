import type { Elysia } from 'elysia';
import { HttpStatus } from '../utils/http-status';
import { isHttpError, type ErrorDetails } from '../utils/http-error';
import { isProd } from '../utils/env';

type FrameworkErrorCode = 'NOT_FOUND' | 'VALIDATION' | 'PARSE' | 'UNKNOWN';

type ErrorLike = {
  message?: string;
  code?: string;
  command?: string;
  status?: number;
  details?: ErrorDetails;
  all?: Array<{ path?: string; message?: string; summary?: string }>;
  cause?: unknown;
  name?: string;
  stack?: string;
};

type ErrorBody = {
  error: {
    code: string;
    message: string;
    status: number;
    requestId: string;
    path: string;
    method: string;
    timestamp: string;
    details?: ErrorDetails;
  };
};

type InfraMapping = {
  status: number;
  code: string;
  message: string;
};

const INTERNAL_MESSAGE = 'Something went wrong. Please try again.';

const pickRequestId = (
  headerRequestId: string | null,
  responseRequestId: string | undefined,
): string => headerRequestId || responseRequestId || crypto.randomUUID();

const toErrorLike = (error: object | null | undefined): ErrorLike => {
  if (!error) return {};
  return error as ErrorLike;
};

const readNestedCode = (value: unknown, depth = 0): string | undefined => {
  if (!value || typeof value !== 'object' || depth > 4) return undefined;
  const candidate = value as { code?: unknown; cause?: unknown };
  if (typeof candidate.code === 'string' && candidate.code.trim().length > 0) {
    return candidate.code;
  }
  return readNestedCode(candidate.cause, depth + 1);
};

const toInfraMapping = (err: ErrorLike): InfraMapping => {
  const infraCode = err.code ?? readNestedCode(err.cause);
  const infraCommand =
    typeof err.command === 'string'
      ? err.command
      : err.cause &&
          typeof err.cause === 'object' &&
          'command' in (err.cause as Record<string, unknown>)
        ? String((err.cause as Record<string, unknown>).command ?? '')
        : '';

  if (infraCode === '23505') {
    return {
      status: HttpStatus.CONFLICT,
      code: 'UNIQUE_VIOLATION',
      message: 'A record with the same unique value already exists.',
    };
  }
  if (infraCode === '23503') {
    return {
      status: HttpStatus.CONFLICT,
      code: 'FOREIGN_KEY_VIOLATION',
      message: 'A related record is missing or invalid.',
    };
  }
  if (infraCode === 'ESOCKET' || infraCommand === 'CONN') {
    return {
      status: HttpStatus.BAD_GATEWAY,
      code: 'UPSTREAM_UNAVAILABLE',
      message: 'A dependent service is temporarily unavailable.',
    };
  }
  if (infraCode === '42883') {
    return {
      status: HttpStatus.SERVICE_UNAVAILABLE,
      code: 'POSTGIS_NOT_ENABLED',
      message: 'Geospatial features are unavailable. Please enable PostGIS.',
    };
  }

  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    code: 'INTERNAL_SERVER_ERROR',
    message: INTERNAL_MESSAGE,
  };
};

const extractValidationDetails = (err: ErrorLike): ErrorDetails | undefined => {
  if (Array.isArray(err.all) && err.all.length > 0) {
    const fields = err.all
      .map((issue) => {
        const fieldPath = issue.path ?? '';
        const fieldMessage = issue.summary ?? issue.message ?? '';
        if (!fieldMessage) return null;
        return fieldPath ? `${fieldPath}: ${fieldMessage}` : fieldMessage;
      })
      .filter((item): item is string => item !== null);

    if (fields.length > 0) return { fields };
  }

  if (typeof err.cause === 'string' && err.cause.length > 0) {
    return { cause: err.cause };
  }

  return undefined;
};

const buildErrorBody = (params: {
  code: string;
  message: string;
  status: number;
  requestId: string;
  path: string;
  method: string;
  details?: ErrorDetails;
}): ErrorBody => ({
  error: {
    code: params.code,
    message: params.message,
    status: params.status,
    requestId: params.requestId,
    path: params.path,
    method: params.method,
    timestamp: new Date().toISOString(),
    details: params.details,
  },
});

const sanitizeMessage = (value: string | undefined, fallback: string): string => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const toPlainRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== 'object') return undefined;
  try {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  } catch {
    return {
      text: String(value),
    };
  }
};

const logLocalServerError = (params: {
  status: number;
  requestId: string;
  path: string;
  method: string;
  frameworkCode: FrameworkErrorCode;
  publicCode: string;
  publicMessage: string;
  originalMessage?: string;
  originalCode?: string;
  stack?: string;
  details?: ErrorDetails;
  cause?: unknown;
}) => {
  if (isProd || params.status < HttpStatus.INTERNAL_SERVER_ERROR) return;

  console.log(
    '[LOCAL_500]',
    JSON.stringify(
      {
        t: new Date().toISOString(),
        requestId: params.requestId,
        path: params.path,
        method: params.method,
        frameworkCode: params.frameworkCode,
        status: params.status,
        publicCode: params.publicCode,
        publicMessage: params.publicMessage,
        originalCode: params.originalCode ?? null,
        originalMessage: params.originalMessage ?? null,
        details: params.details ?? null,
        stack: params.stack ?? null,
        cause: toPlainRecord(params.cause) ?? null,
      },
      null,
      2,
    ),
  );
};

export function errorHandler(app: Elysia) {
  return app.onError(({ code, error, set, request }) => {
    const path = new URL(request.url).pathname;
    const requestId = pickRequestId(
      request.headers.get('x-request-id'),
      set.headers['x-request-id']?.toString(),
    );
    const method = request.method;
    const frameworkCode = (code as FrameworkErrorCode) || 'UNKNOWN';

    if (frameworkCode === 'NOT_FOUND') {
      set.status = HttpStatus.NOT_FOUND;
      return buildErrorBody({
        code: 'ROUTE_NOT_FOUND',
        message: 'The requested route was not found.',
        status: HttpStatus.NOT_FOUND,
        requestId,
        path,
        method,
      });
    }

    if (frameworkCode === 'VALIDATION') {
      const err = toErrorLike(typeof error === 'object' ? error : null);
      set.status = HttpStatus.BAD_REQUEST;
      return buildErrorBody({
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed. Check the provided input.',
        status: HttpStatus.BAD_REQUEST,
        requestId,
        path,
        method,
        details: extractValidationDetails(err),
      });
    }

    if (frameworkCode === 'PARSE') {
      set.status = HttpStatus.BAD_REQUEST;
      return buildErrorBody({
        code: 'INVALID_REQUEST_BODY',
        message: 'Request body could not be parsed. Ensure the payload format is valid.',
        status: HttpStatus.BAD_REQUEST,
        requestId,
        path,
        method,
      });
    }

    if (typeof error === 'object' && isHttpError(error)) {
      const message = sanitizeMessage(error.message, 'Request failed.');
      set.status = error.status;
      logLocalServerError({
        status: error.status,
        requestId,
        path,
        method,
        frameworkCode,
        publicCode: 'HTTP_ERROR',
        publicMessage: message,
        originalMessage: error.message,
        details: error.details,
        stack: (error as { stack?: string }).stack,
        cause: (error as { cause?: unknown }).cause,
      });
      return buildErrorBody({
        code: 'HTTP_ERROR',
        message,
        status: error.status,
        requestId,
        path,
        method,
        details: error.details,
      });
    }

    const err = toErrorLike(typeof error === 'object' ? error : null);
    const mapped = toInfraMapping(err);
    set.status = mapped.status;
    logLocalServerError({
      status: mapped.status,
      requestId,
      path,
      method,
      frameworkCode,
      publicCode: mapped.code,
      publicMessage: mapped.message,
      originalMessage: err.message,
      originalCode: err.code ?? readNestedCode(err.cause),
      stack: err.stack,
      details: err.details,
      cause: err.cause,
    });

    return buildErrorBody({
      code: mapped.code,
      message: mapped.message,
      status: mapped.status,
      requestId,
      path,
      method,
    });
  });
}
