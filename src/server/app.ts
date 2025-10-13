import { Elysia } from 'elysia';
import { sentryPlugin } from './plugins/sentry';
import { swaggerPlugin } from './plugins/swagger';
import { requestId } from './middlewares/requestId';
import { logger } from './middlewares/logger';
import { errorHandler } from './middlewares/error-handler';
import { health } from './routes/health';
import { api } from './routes';
import { HttpStatus } from './utils/http-status';
import { devMailRoutes } from './routes/dev-mail';
import { isDev } from './utils/env';
import { corsPlugin } from './plugins/cors';
import { authPasswordRoutes } from './features/auth/routes.reset-password';
import { usersInviteRoutes } from './features/auth/routes.invite-resend';
import { branchesRoutes } from './features/branches/routes';
import { locationsRoutes } from './features/locations/routes';
import { statusesRoutes } from './features/statuses/routes';

export const app = new Elysia()
  .use(swaggerPlugin)
  .use(sentryPlugin)
  // CORS early so preflights succeed
  .use(corsPlugin)
  .use(requestId)
  .use(logger)
  .use(errorHandler)
  .use(health)
  // Mount dev routes BEFORE any catch-all
  .use(isDev ? devMailRoutes : (a: Elysia) => a)

  .group('/v1', (v1) => v1.use(api).use(authPasswordRoutes).use(usersInviteRoutes))
  .group('/branches', (r) => r.use(branchesRoutes))
  .group('/locations', (r) => r.use(locationsRoutes))
  .group('/statuses', (r) => r.use(statusesRoutes))
  .get('/', () => ({ name: 'vipex-api', version: 'v1' }))
  // Catch-all fallback for unmatched routes inside Elysia
  .all('/*', ({ set, request }) => {
    set.status = HttpStatus.NOT_FOUND;
    const path = new URL(request.url).pathname;
    return {
      error: {
        message: 'Route not found',
        status: HttpStatus.NOT_FOUND,
        path,
      },
    };
  });

export const apiFetch = app.handle;
