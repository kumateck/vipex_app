import type { Elysia } from 'elysia';
import { HttpStatus } from '../utils/http-status';
import { isHttpError, type ErrorDetails } from '../utils/http-error';

type FrameworkErrorCode = 'NOT_FOUND' | 'VALIDATION' | 'PARSE' | 'UNKNOWN';

type ErrorLike = {
  message?: string;
  code?: string;
  command?: string;
  status?: number;
  details?: ErrorDetails;
  all?: Array<{ path?: string; message?: string; summary?: string }>;
  cause?: string | Record<string, string>;
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

const pickRequestId = (headerRequestId: string | null, responseRequestId: string | undefined): string =>
  headerRequestId || responseRequestId || crypto.randomUUID();

const toErrorLike = (error: object | null | undefined): ErrorLike => {
  if (!error) return {};
  return error as ErrorLike;
};

const toInfraMapping = (err: ErrorLike): InfraMapping => {
  if (err.code === '23505') {
    return {
      status: HttpStatus.CONFLICT,
      code: 'UNIQUE_VIOLATION',
      message: 'A record with the same unique value already exists.',
    };
  }
  if (err.code === '23503') {
    return {
      status: HttpStatus.CONFLICT,
      code: 'FOREIGN_KEY_VIOLATION',
      message: 'A related record is missing or invalid.',
    };
  }
  if (err.code === 'ESOCKET' || err.command === 'CONN') {
    return {
      status: HttpStatus.BAD_GATEWAY,
      code: 'UPSTREAM_UNAVAILABLE',
      message: 'A dependent service is temporarily unavailable.',
    };
  }
  if (err.code === '42883') {
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

    // Keep unexpected error diagnostics in server logs, but return safe message to clients.
    console.error(
      JSON.stringify({
        t: new Date().toISOString(),
        requestId,
        path,
        method,
        code: mapped.code,
        originalMessage: err.message || null,
        originalCode: err.code || null,
        stack: err.stack || null,
      }),
    );

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
