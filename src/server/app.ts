import { Elysia } from 'elysia';
import { sentryPlugin } from './plugins/sentry';
import { swaggerPlugin } from './plugins/swagger';
import { requestId } from './middlewares/requestId';
import { logger } from './middlewares/logger';
import { auditTrail } from './middlewares/audit-trail';
import { errorHandler } from './middlewares/error-handler';
import { rateLimit } from './middlewares/rate-limit';
import { health } from './routes/health';
import { api } from './routes';
import { HttpStatus } from './utils/http-status';
import { devMailRoutes } from './routes/dev-mail';
import { isDev } from './utils/env';
import { corsPlugin } from './plugins/cors';
import { usersInviteRoutes } from './features/auth/routes.invite-resend';
import { branchesRoutes } from './features/branches/routes';
import { locationsRoutes } from './features/locations/routes';
import { usersRoutes } from './features/users/routes';
import { customersRoutes } from './features/customers/routes';
import { bookingsRoutes } from './features/shipments/bookings.routes';
import { parcelsRoutes } from './features/shipments/parcels.routes';
import { consignmentsRoutes } from './features/shipments/consignments.routes';
import { autoGroupingRoutes } from './features/consignments/auto-grouping.routes';
import { cashiersRoutes } from './features/cashiers/routes';
import { paymentsRoutes } from './features/payments/routes';
import { paymentCalculationRoutes } from './features/payments/calculation.routes';
import { deliveriesRoutes } from './features/deliveries/routes';
import { accountingRoutes } from './features/accounting/routes';
import { bookingWithParcelsRoutes } from './features/shipments/booking-with-parcels.routes';
import { inventoryRoutes } from './features/inventory/routes';
import { shiftsRoutes } from './features/shifts/routes';
import { reportingRoutes } from './features/reporting/routes';
import { auditRoutes } from './features/audit/routes';
import { hrRoutes } from './features/hr/routes';
import { payrollRoutes } from './features/payroll/routes';
import { rbacRoutes } from './features/rbac/routes';
import { geolocationRoutes } from './features/geolocation/routes';
import { cardsRoutes } from './features/cards/routes';
import { pickupQueuesRoutes } from './features/pickup-queues/routes';
import { companyModulesRoutes } from './features/company-modules/routes';
import { warehousesRoutes } from './features/warehouses/routes';
import { parcelInternalTransfersRoutes } from './features/parcel-internal-transfers/routes';
import { uploadsRoutes } from './features/uploads/routes';
import { moduleWorkspaceRoutes } from './features/module-workspace/routes';
import { communicationRoutes } from './features/communication/routes';
import { customerServiceRoutes } from './features/customer-service/routes';
import { itSupportRoutes } from './features/it-support/routes';
import { procurementRoutes } from './features/procurement/routes';
import { fleetTransportRoutes } from './features/fleet-transport/routes';
import { customerWalletCreditRoutes } from './features/customer-wallet-credit/routes';
import { reconciliationRoutes } from './features/reconciliation/routes';
import { notificationHubRoutes } from './features/notification-hub/routes';

export const app = new Elysia()
  .use(swaggerPlugin)
  .use(sentryPlugin)
  // CORS early so preflights succeed
  .use(corsPlugin)
  .use(requestId)
  .use(rateLimit)
  .use(logger)
  .use(auditTrail)
  .use(errorHandler)
  .use(health)
  // Mount dev routes BEFORE any catch-all
  .use(isDev ? devMailRoutes : (a: Elysia) => a)
  .group('/v1', (v1) =>
    v1
      .use(api)
      .group('/users', (r) => r.use(usersRoutes).use(usersInviteRoutes))
      .group('/branches', (r) => r.use(branchesRoutes))
      .group('/locations', (r) => r.use(locationsRoutes))
      .group('/warehouses', (r) => r.use(warehousesRoutes))
      .group('/customers', (r) => r.use(customersRoutes))
      .group('/cards', (r) => r.use(cardsRoutes))
      .group('/uploads', (r) => r.use(uploadsRoutes))
      .group('/cashiers', (r) => r.use(cashiersRoutes))
      .group(
        '/shipments',
        (s) =>
          s
            .group('/bookings', (r) => r.use(bookingsRoutes).use(bookingWithParcelsRoutes))
            .group('/parcels', (r) => r.use(parcelsRoutes))
            .group('/parcel-internal-transfers', (r) => r.use(parcelInternalTransfersRoutes))
            .group('/consignments', (r) => r.use(consignmentsRoutes))
            .group('/auto-grouping', (r) => r.use(autoGroupingRoutes)),
        // .group('/shifts', (r) => r.use(shiftManagementRoutes))
        // .group('/shift-management', (r) => r.use(shiftManagementRoutes)),
      )
      .group('/payments', (r) => r.use(paymentsRoutes).use(paymentCalculationRoutes))
      .group('/deliveries', (r) => r.use(deliveriesRoutes))
      .group('/pickup-queues', (r) => r.use(pickupQueuesRoutes))
      .group('/accounting', (r) => r.use(accountingRoutes))
      .group('/inventory', (r) => r.use(inventoryRoutes))
      .group('/shifts', (r) => r.use(shiftsRoutes))
      .group('/company-modules', (r) => r.use(companyModulesRoutes))
      .group('/module-workspace', (r) => r.use(moduleWorkspaceRoutes))
      .group('/procurement', (r) => r.use(procurementRoutes))
      .group('/fleet-transport', (r) => r.use(fleetTransportRoutes))
      .group('/customer-wallet-credit', (r) => r.use(customerWalletCreditRoutes))
      .group('/reconciliation', (r) => r.use(reconciliationRoutes))
      .group('/notification-hub', (r) => r.use(notificationHubRoutes))
      .group('/communication', (r) => r.use(communicationRoutes))
      .group('/customer-service', (r) => r.use(customerServiceRoutes))
      .group('/it-support', (r) => r.use(itSupportRoutes))
      .group('/reports', (r) => r.use(reportingRoutes))
      .group('/audit', (r) => r.use(auditRoutes))
      .group('/hr', (r) => r.use(hrRoutes))
      .group('/payroll', (r) => r.use(payrollRoutes))
      .group('/rbac', (r) => r.use(rbacRoutes))
      .group('/geolocation', (r) => r.use(geolocationRoutes)),
  )
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
