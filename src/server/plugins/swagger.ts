// import { swagger } from '@elysiajs/swagger';
// import type { Elysia } from 'elysia';
// import { env } from '../utils/env';

// export const swaggerPlugin = (app: Elysia) => {
//   const raw = process.env.SWAGGER_ENABLED;
//   const enabled = raw === undefined ? true : raw.toLowerCase() !== 'false';

//   if (!enabled) {
//     console.log('Swagger disabled (SWAGGER_ENABLED=false)');
//     return app;
//   }

//   return app.use(
//     swagger({
//       path: '/docs',
//       documentation: {
//         openapi: '3.1.0',
//         info: {
//           title: 'Vipex API',
//           version: '1.0.0',
//           description: 'API documentation for the Vipex backend.',
//         },
//         servers: [{ url: `http://localhost:${env.PORT}`, description: 'Local' }],
//         components: {
//           securitySchemes: {
//             bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
//           },
//         },
//       },
//     }),
//   );
// };

import { swagger } from '@elysiajs/swagger';
import type { Elysia } from 'elysia';
import { env } from '../utils/env';

export const swaggerPlugin = (app: Elysia) => {
  // Default enabled unless explicitly set to 'false'
  const enabled =
    env.SWAGGER_ENABLED === undefined
      ? true
      : String(env.SWAGGER_ENABLED).toLowerCase() !== 'false';

  if (!enabled) {
    console.log('Swagger disabled (SWAGGER_ENABLED=false)');
    return app;
  }

  const servers: Array<{ url: string; description: string }> = [
    // Same-origin server: works whether you run on localhost or behind a reverse proxy
    { url: '/', description: 'Same origin' },
  ];

  if (env.APP_BASE_URL) {
    servers.push({ url: env.APP_BASE_URL, description: 'APP_BASE_URL' });
  }

  return app.use(
    swagger({
      // UI at /docs, JSON at /docs/json
      path: '/docs',
      documentation: {
        openapi: '3.1.0',
        info: {
          title: 'API',
          version: '1.0.0',
          description: 'Interactive API documentation',
        },
        servers,
        // Global security requirement so “Authorize” applies to all operations (unless a route overrides)
        security: [{ bearerAuth: [] }],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'Paste the JWT access token here. Do not include the "Bearer " prefix.',
            },
          },
        },
      },
    }),
  );
};
