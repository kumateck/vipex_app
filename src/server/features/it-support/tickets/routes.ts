import { Elysia } from 'elysia';
import {
  authPlugin,
  requireAuth,
  requireAnyPermissions,
  requireModuleEnabled,
  requirePermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  createItSupportTicketNoteCtrl,
  createItSupportTicketsCtrl,
  getItSupportTicketsCtrl,
  listItSupportTicketEventsCtrl,
  listItSupportTicketsCtrl,
  updateItSupportTicketsCtrl,
} from './controller';
import {
  ItSupportTicketsCreateBodySchema,
  ItSupportTicketsIdParamSchema,
  ItSupportTicketsListQuerySchema,
  ItSupportTicketNoteBodySchema,
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
        branchId: query.branchId ?? undefined,
        locationId: query.locationId ?? undefined,
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
  .get(
    '/:id',
    async ({ params, user }) =>
      getItSupportTicketsCtrl({
        companyId: user!.companyId!,
        ticketId: params.id,
      }),
    {
      params: ItSupportTicketsIdParamSchema,
      beforeHandle: [
        requireAuth(),
        requireModuleEnabled('it_support'),
        requirePermissions(PermissionKeys.CanReadItSupportTickets),
      ],
    },
  )
  .get(
    '/:id/events',
    async ({ params, user }) =>
      listItSupportTicketEventsCtrl({
        companyId: user!.companyId!,
        ticketId: params.id,
      }),
    {
      params: ItSupportTicketsIdParamSchema,
      beforeHandle: [
        requireAuth(),
        requireModuleEnabled('it_support'),
        requirePermissions(PermissionKeys.CanReadItSupportTickets),
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
        branchId: body.branchId ?? undefined,
        locationId: body.locationId ?? undefined,
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
  )
  .post(
    '/:id/notes',
    async ({ params, body, user }) =>
      createItSupportTicketNoteCtrl({
        companyId: user!.companyId!,
        userId: user!.sub,
        ticketId: params.id,
        note: body.note,
        canManageTickets: (user!.permissions ?? []).includes(
          PermissionKeys.CanUpdateItSupportTickets,
        ),
      }),
    {
      params: ItSupportTicketsIdParamSchema,
      body: ItSupportTicketNoteBodySchema,
      beforeHandle: [
        requireAuth(),
        requireModuleEnabled('it_support'),
        requireAnyPermissions(
          PermissionKeys.CanUpdateItSupportTickets,
          PermissionKeys.CanReadItSupportTickets,
        ),
      ],
    },
  );
