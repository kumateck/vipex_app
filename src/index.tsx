import { serve } from 'bun';
import { apiFetch } from './server/app';
import { logger as devLogger } from './server/utils/logger';
import { join, resolve } from 'node:path';

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
      return new Response(asset);
    }
  }

  const index = Bun.file(webIndexPath);
  if (await index.exists()) {
    return new Response(index, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return new Response('Frontend build not found. Run "bun run build:web".', {
    status: 500,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

// One Bun server for Frontend + API + Swagger
const server = serve({
  routes: {
    // Swagger / OpenAPI (must come before the catch-all)
    '/docs': (req) => apiFetch(req),
    '/docs/*': (req) => apiFetch(req),
    '/dev/*': (req) => apiFetch(req),
    // API routes (Elysia)
    '/health': (req) => apiFetch(req),
    '/v1/*': (req) => apiFetch(req),

    // Fallback: serve built SPA assets from apps/web/dist
    '/*': (req) => serveWebAsset(req),
  },

  development: process.env.NODE_ENV !== 'production' && {
    hmr: true,
    console: true,
  },
});

devLogger.info(`🚀 Server running at ${server.url}`);
