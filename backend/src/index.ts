import { serve } from 'bun';
import { apiFetch } from '../../src/server/app';
import { logger as devLogger } from '../../src/server/utils/logger';
import {
  communicationSocketHandlers,
  upgradeCommunicationSocket,
} from '../../src/server/features/communication/realtime';

const server = serve({
  idleTimeout: 60,
  async fetch(req, server) {
    const { pathname } = new URL(req.url);

    if (pathname === '/v1/communication/ws') {
      return await upgradeCommunicationSocket(req, server);
    }

    if (
      pathname === '/docs' ||
      pathname.startsWith('/docs/') ||
      pathname.startsWith('/dev/') ||
      pathname === '/health' ||
      pathname.startsWith('/v1/')
    ) {
      return apiFetch(req);
    }

    return new Response('Not found', { status: 404 });
  },
  websocket: communicationSocketHandlers,
  development: process.env.NODE_ENV !== 'production' && {
    hmr: true,
    console: true,
  },
});

devLogger.info(`Backend running at ${server.url}`);
