import { Elysia } from 'elysia';
import { HttpError } from '../utils/http-error';
import { Sentry } from '../plugins/sentry';

export const errorHandler = new Elysia({ name: 'error-handler' }).onError((ctx) => {
  const { error, set, request } = ctx;
  const rid = request.headers.get('x-request-id') ?? undefined;

  // Capture everything; downgrade HttpError (4xx) as warning level
  if (Sentry) {
    Sentry.withScope((scope) => {
      scope.setTag('request_id', rid || '');
      scope.setTag('path', new URL(request.url).pathname);
      scope.setExtra('method', request.method);
      scope.setExtra('params', ctx.params);
      scope.setExtra('query', ctx.query);
      scope.setLevel(error instanceof HttpError && error.status < 500 ? 'warning' : 'error');
      Sentry.captureException(error);
    });
  }

  if (error instanceof HttpError) {
    set.status = error.status;
    return {
      error: {
        message: error.message,
        status: error.status,
        details: error.details,
        requestId: rid,
      },
    };
  }

  // Fallback
  set.status = 500;
  return {
    error: {
      message: 'Internal Server Error',
      status: 500,
      requestId: rid,
    },
  };
});
