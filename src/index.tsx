import { serve } from 'bun';
import { apiFetch } from './server/app';
import index from './index.html';

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

    // Fallback: serve SPA index.html
    '/*': index,
  },

  development: process.env.NODE_ENV !== 'production' && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
