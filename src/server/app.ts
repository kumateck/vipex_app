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
import { usersRoutes } from './features/users/routes';
import { customersRoutes } from './features/customers/routes';
import { bookingsRoutes } from './features/shipments/bookings.routes';
import { parcelsRoutes } from './features/shipments/parcels.routes';
import { consignmentsRoutes } from './features/shipments/consignments.routes';
import { cashiersRoutes } from './features/cashiers/routes';
import { paymentsRoutes } from './features/payments/routes';
import { deliveriesRoutes } from './features/deliveries/routes';
import { accountingRoutes } from './features/accounting/routes';
import { bookingWithParcelsRoutes } from './features/shipments/booking-with-parcels.routes';
import { inventoryRoutes } from './features/inventory/routes';

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
  .group('/v1', (v1) =>
    v1
      .use(api)
      .group('/users', (r) => r.use(usersRoutes).use(usersInviteRoutes))
      .group('/branches', (r) => r.use(branchesRoutes))
      .group('/statuses', (r) => r.use(statusesRoutes))
      .group('/locations', (r) => r.use(locationsRoutes))
      .group('/customers', (r) => r.use(customersRoutes))
      .group('/cashiers', (r) => r.use(cashiersRoutes))
      .group('/shipments', (s) =>
        s
          .group('/bookings', (r) => r.use(bookingsRoutes).use(bookingWithParcelsRoutes))
          .group('/parcels', (r) => r.use(parcelsRoutes))
          .group('/consignments', (r) => r.use(consignmentsRoutes)),
      )
      .group('/payments', (r) => r.use(paymentsRoutes))
      .group('/deliveries', (r) => r.use(deliveriesRoutes))
      .group('/accounting', (r) => r.use(accountingRoutes))
      .group('/inventory', (r) => r.use(inventoryRoutes)),
  )
  // .group('/v1', (v1) =>
  //   v1
  //     .use(api)
  //     .use(authPasswordRoutes)
  //     .use(usersInviteRoutes)
  //     .group('/branches', (r) => r.use(branchesRoutes))
  //     .group('/statuses', (r) => r.use(statusesRoutes))
  //     .group('/locations', (r) => r.use(locationsRoutes)),
  // )
  // .group('/users', (r) => r.use(usersRoutes))

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
