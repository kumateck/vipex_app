import { swagger } from '@elysiajs/swagger';
import type { Elysia } from 'elysia';
import { env } from '../utils/env';

export const swaggerPlugin = (app: Elysia) => {
  const enabled = process.env.SWAGGER_ENABLED !== 'false';
  if (!enabled) return app;

  return app.use(
    swagger({
      path: '/docs',
      documentation: {
        openapi: '3.1.0',
        info: {
          title: 'Vipex API',
          version: '1.0.0',
          description: 'API documentation for the Vipex backend.',
        },
        servers: [{ url: `http://localhost:${env.PORT}`, description: 'Local' }],
        components: {
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          },
        },
      },
    }),
  );
};
