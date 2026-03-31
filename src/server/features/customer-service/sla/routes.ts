import { Elysia } from 'elysia';
import { authPlugin, requireAuth, requireModuleEnabled } from '@/server/plugins/auth';
import { createCustomerServiceSlaCtrl, listCustomerServiceSlaCtrl } from './controller';
import { CustomerServiceSlaCreateBodySchema, CustomerServiceSlaListQuerySchema } from './schema';

export const CustomerServiceSlaRoutes = new Elysia({ name: 'sla' })
  .use(authPlugin)
  .get('/', async ({ user }) => listCustomerServiceSlaCtrl({ companyId: user!.companyId! }), {
    query: CustomerServiceSlaListQuerySchema,
    beforeHandle: [requireAuth(), requireModuleEnabled('communication_customer_service')],
  })
  .post(
    '/',
    async ({ body, user }) =>
      createCustomerServiceSlaCtrl({
        ...body,
        companyId: user!.companyId!,
        userId: user!.sub,
      }),
    {
      body: CustomerServiceSlaCreateBodySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_customer_service')],
    },
  );
