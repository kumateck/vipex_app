import { Elysia } from 'elysia';
import { authPlugin, requireAuth, requireModuleEnabled } from '@/server/plugins/auth';
import { createCustomerServiceTicketsCtrl, listCustomerServiceTicketsCtrl } from './controller';
import {
  CustomerServiceTicketsCreateBodySchema,
  CustomerServiceTicketsListQuerySchema,
} from './schema';

export const CustomerServiceTicketsRoutes = new Elysia({ name: 'tickets' })
  .use(authPlugin)
  .get(
    '/',
    async ({ query, user }) =>
      listCustomerServiceTicketsCtrl({
        companyId: user!.companyId!,
        status: query.status ?? undefined,
        priority: query.priority ?? undefined,
      }),
    {
      query: CustomerServiceTicketsListQuerySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_customer_service')],
    },
  )
  .post(
    '/',
    async ({ body, user }) =>
      createCustomerServiceTicketsCtrl({
        ...body,
        companyId: user!.companyId!,
        userId: user!.sub,
      }),
    {
      body: CustomerServiceTicketsCreateBodySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_customer_service')],
    },
  );
