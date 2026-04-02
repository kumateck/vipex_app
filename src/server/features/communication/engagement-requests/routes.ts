import { Elysia } from 'elysia';
import type { AuthUser } from '@/server/plugins/auth';
import { authPlugin, requireAuth, requireModuleEnabled } from '@/server/plugins/auth';
import {
  approveCommunicationEngagementRequestsCtrl,
  createCommunicationEngagementRequestsCtrl,
  declineCommunicationEngagementRequestsCtrl,
  listCommunicationEngagementRequestsCtrl,
} from './controller';
import {
  CommunicationEngagementRequestsCreateBodySchema,
  CommunicationEngagementRequestsIdParamSchema,
  CommunicationEngagementRequestsListQuerySchema,
} from './schema';

export const CommunicationEngagementRequestsRoutes = new Elysia({ name: 'engagement-requests' })
  .use(authPlugin)
  .get(
    '/',
    async ({ query, user }) =>
      listCommunicationEngagementRequestsCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        view: query.view ?? undefined,
        status: query.status ?? undefined,
      }),
    {
      query: CommunicationEngagementRequestsListQuerySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  )
  .post(
    '/',
    async ({ body, user }) =>
      createCommunicationEngagementRequestsCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        requesterUserId: (user as AuthUser | null)?.sub ?? '',
        targetUserId: body.targetUserId,
        reasonCode: body.reasonCode ?? null,
        reasonNote: body.reasonNote ?? null,
        linkedEntityType: body.linkedEntityType ?? null,
        linkedEntityId: body.linkedEntityId ?? null,
        scope: body.scope ?? undefined,
        expiresAt: body.expiresAt ?? null,
      }),
    {
      body: CommunicationEngagementRequestsCreateBodySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  )
  .post(
    '/:id/approve',
    async ({ params, user }) =>
      approveCommunicationEngagementRequestsCtrl({
        id: params.id,
        companyId: (user as AuthUser | null)?.companyId ?? '',
        actingUserId: (user as AuthUser | null)?.sub ?? '',
      }),
    {
      params: CommunicationEngagementRequestsIdParamSchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  )
  .post(
    '/:id/decline',
    async ({ params, user }) =>
      declineCommunicationEngagementRequestsCtrl({
        id: params.id,
        companyId: (user as AuthUser | null)?.companyId ?? '',
        actingUserId: (user as AuthUser | null)?.sub ?? '',
      }),
    {
      params: CommunicationEngagementRequestsIdParamSchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  );
