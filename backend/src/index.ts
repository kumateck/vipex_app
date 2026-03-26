import { serve } from 'bun';
import { apiFetch } from '../../src/server/app';
import { logger as devLogger } from '../../src/server/utils/logger';

const server = serve({
  routes: {
    '/docs': (req) => apiFetch(req),
    '/docs/*': (req) => apiFetch(req),
    '/dev/*': (req) => apiFetch(req),
    '/health': (req) => apiFetch(req),
    '/v1/*': (req) => apiFetch(req),
  },
  development: process.env.NODE_ENV !== 'production' && {
    hmr: true,
    console: true,
  },
});

devLogger.info(`Backend running at ${server.url}`);
