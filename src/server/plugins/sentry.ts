import * as Sentry from '@sentry/bun';
import type { Elysia } from 'elysia';
import { env } from '../utils/env';

// Elysia plugin as a function: (app) => app
// Initializes Sentry once if SENTRY_DSN is present, otherwise no-op.
export const sentryPlugin = (app: Elysia) => {
  if (!env.SENTRY_DSN) return app;

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENV,
    release: env.RELEASE,
    // Sampling (tune for your traffic)
    sampleRate: env.SENTRY_SAMPLE_RATE, // error events
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE, // performance traces

    // Privacy: scrub sensitive headers
    beforeSend(event) {
      if (event.request && event.request.headers) {
        const h = event.request.headers as Record<string, unknown>;
        delete h.authorization;
        delete h.cookie;
      }
      return event;
    },

    // Keep PII off by default
    sendDefaultPii: false,
  });

  return app;
};

// Re-export for use in middlewares (captureException, etc.)
export { Sentry };
