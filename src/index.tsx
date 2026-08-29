import { serve } from 'bun';
import { apiFetch } from './server/app';
import { logger as devLogger } from './server/utils/logger';
import { join, resolve } from 'node:path';
import { getWebCacheHeaders } from './server/utils/web-cache';
import {
  communicationSocketHandlers,
  upgradeCommunicationSocket,
} from './server/features/communication/realtime';

const webDistDir = resolve(process.cwd(), 'apps/web/dist');
const webIndexPath = join(webDistDir, 'index.html');

const isPathInside = (targetPath: string, basePath: string) => {
  const normalizedTarget = resolve(targetPath);
  const normalizedBase = resolve(basePath);
  return normalizedTarget === normalizedBase || normalizedTarget.startsWith(`${normalizedBase}/`);
};

async function serveWebAsset(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = resolve(webDistDir, relativePath);

  if (isPathInside(filePath, webDistDir)) {
    const asset = Bun.file(filePath);
    if (await asset.exists()) {
      return new Response(asset, { headers: getWebCacheHeaders(pathname) });
    }
  }

  if (pathname.startsWith('/assets/')) {
    return new Response('Build asset not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  const index = Bun.file(webIndexPath);
  if (await index.exists()) {
    return new Response(index, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        ...getWebCacheHeaders(pathname, true),
      },
    });
  }

  return new Response('Frontend build not found. Run "bun run build:web".', {
    status: 500,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

// One Bun server for Frontend + API + Swagger
const server = serve({
  idleTimeout: 60,
  async fetch(req, server) {
    const { pathname } = new URL(req.url);

    if (pathname === '/v1/communication/ws') {
      return await upgradeCommunicationSocket(req, server);
    }

    // Swagger / OpenAPI and API routes
    if (
      pathname === '/docs' ||
      pathname.startsWith('/docs/') ||
      pathname.startsWith('/dev/') ||
      pathname === '/health' ||
      pathname.startsWith('/v1/')
    ) {
      return apiFetch(req);
    }

    // Fallback: serve built SPA assets from apps/web/dist
    return serveWebAsset(req);
  },
  websocket: communicationSocketHandlers,
  development: process.env.NODE_ENV !== 'production' && {
    hmr: true,
    console: true,
  },
});

devLogger.info(`🚀 Server running at ${server.url}`);
