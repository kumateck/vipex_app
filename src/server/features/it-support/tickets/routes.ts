import { Elysia } from 'elysia';
import {
  authPlugin,
  requireAuth,
  requireModuleEnabled,
  requirePermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  createItSupportTicketsCtrl,
  listItSupportTicketsCtrl,
  updateItSupportTicketsCtrl,
} from './controller';
import {
  ItSupportTicketsCreateBodySchema,
  ItSupportTicketsIdParamSchema,
  ItSupportTicketsListQuerySchema,
  ItSupportTicketsUpdateBodySchema,
} from './schema';

export const ItSupportTicketsRoutes = new Elysia({ name: 'it-support-tickets' })
  .use(authPlugin)
  .get(
    '/',
    async ({ query, user }) =>
      listItSupportTicketsCtrl({
        companyId: user!.companyId!,
        status: query.status ?? undefined,
        priority: query.priority ?? undefined,
        assignedToUserId: query.assignedToUserId ?? undefined,
      }),
    {
      query: ItSupportTicketsListQuerySchema,
      beforeHandle: [
        requireAuth(),
        requireModuleEnabled('it_support'),
        requirePermissions(PermissionKeys.CanReadItSupportTickets),
      ],
    },
  )
  .post(
    '/',
    async ({ body, user }) =>
      createItSupportTicketsCtrl({
        ...body,
        companyId: user!.companyId!,
        userId: user!.sub,
      }),
    {
      body: ItSupportTicketsCreateBodySchema,
      beforeHandle: [
        requireAuth(),
        requireModuleEnabled('it_support'),
        requirePermissions(PermissionKeys.CanCreateItSupportTickets),
      ],
    },
  )
  .patch(
    '/:id',
    async ({ params, body, user }) =>
      updateItSupportTicketsCtrl({
        ticketId: params.id,
        companyId: user!.companyId!,
        userId: user!.sub,
        status: body.status ?? undefined,
        priority: body.priority ?? undefined,
        category: body.category ?? undefined,
        assignedToUserId: body.assignedToUserId ?? undefined,
        note: body.note ?? undefined,
      }),
    {
      params: ItSupportTicketsIdParamSchema,
      body: ItSupportTicketsUpdateBodySchema,
      beforeHandle: [
        requireAuth(),
        requireModuleEnabled('it_support'),
        requirePermissions(PermissionKeys.CanUpdateItSupportTickets),
      ],
    },
  );
