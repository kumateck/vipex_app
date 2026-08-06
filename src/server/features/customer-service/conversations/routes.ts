import { Elysia } from 'elysia';
import type { AuthUser } from '@/server/plugins/auth';
import { authPlugin, requireAuth, requireModuleEnabled } from '@/server/plugins/auth';
import {
  createCustomerServiceConversationsCtrl,
  listCustomerServiceConversationsCtrl,
} from './controller';
import {
  CustomerServiceConversationsCreateBodySchema,
  CustomerServiceConversationsListQuerySchema,
} from './schema';

export const CustomerServiceConversationsRoutes = new Elysia({ name: 'conversations' })
  .use(authPlugin)
  .get(
    '/',
    async ({ user }) =>
      listCustomerServiceConversationsCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
      }),
    {
      query: CustomerServiceConversationsListQuerySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_customer_service')],
    },
  )
  .post(
    '/',
    async ({ body, user }) =>
      createCustomerServiceConversationsCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        customerId: body.customerId ?? null,
        channel: body.channel ?? null,
        branchId: body.branchId ?? null,
        locationId: body.locationId ?? null,
      }),
    {
      body: CustomerServiceConversationsCreateBodySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_customer_service')],
    },
  );
