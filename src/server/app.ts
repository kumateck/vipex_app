import { Elysia } from 'elysia';
import { sentryPlugin } from './plugins/sentry';
import { swaggerPlugin } from './plugins/swagger';
import { requestId } from './middlewares/requestId';
import { logger } from './middlewares/logger';
import { errorHandler } from './middlewares/error-handler';
import { health } from './routes/health';
import { api } from './routes';
import { HttpStatus } from './utils/http-status';

export const app = new Elysia()
  .use(swaggerPlugin)
  .use(sentryPlugin)
  .use(requestId)
  .use(logger)
  .use(errorHandler)
  .use(health)
  .group('/v1', (v1) => v1.use(api))
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
