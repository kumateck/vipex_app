import { Elysia } from 'elysia';
import { authPlugin, requireAuth, requireModuleEnabled } from '@/server/plugins/auth';
import { createCustomerServiceFeedbackCtrl, listCustomerServiceFeedbackCtrl } from './controller';
import {
  CustomerServiceFeedbackCreateBodySchema,
  CustomerServiceFeedbackListQuerySchema,
} from './schema';

export const CustomerServiceFeedbackRoutes = new Elysia({ name: 'feedback' })
  .use(authPlugin)
  .get(
    '/',
    async ({ query, user }) =>
      listCustomerServiceFeedbackCtrl({
        companyId: user!.companyId!,
        ticketId: query.ticketId,
      }),
    {
      query: CustomerServiceFeedbackListQuerySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_customer_service')],
    },
  )
  .post(
    '/',
    async ({ body, user }) =>
      createCustomerServiceFeedbackCtrl({
        ...body,
        companyId: user!.companyId!,
      }),
    {
      body: CustomerServiceFeedbackCreateBodySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_customer_service')],
    },
  );
