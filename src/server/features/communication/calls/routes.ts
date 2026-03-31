import { Elysia } from 'elysia';
import type { AuthUser } from '@/server/plugins/auth';
import { authPlugin, requireAuth, requireModuleEnabled } from '@/server/plugins/auth';
import {
  createCommunicationCallLivekitTokenCtrl,
  createCommunicationCallsCtrl,
  listCommunicationCallsCtrl,
  updateCommunicationCallStatusCtrl,
} from './controller';
import {
  CommunicationCallsCreateBodySchema,
  CommunicationCallsIdParamSchema,
  CommunicationCallsListQuerySchema,
  CommunicationCallsUpdateStatusBodySchema,
} from './schema';

export const CommunicationCallsRoutes = new Elysia({ name: 'calls' })
  .use(authPlugin)
  .get(
    '/',
    async ({ query, user }) =>
      listCommunicationCallsCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        threadId: query.threadId ?? undefined,
        channelId: query.channelId ?? undefined,
        status: query.status ?? undefined,
      }),
    {
      query: CommunicationCallsListQuerySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_calls_livekit')],
    },
  )
  .post(
    '/',
    async ({ body, user }) =>
      createCommunicationCallsCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        threadId: body.threadId ?? null,
        channelId: body.channelId ?? null,
        callType: body.callType ?? 'audio',
        livekitRoomName: body.livekitRoomName ?? null,
      }),
    {
      body: CommunicationCallsCreateBodySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_calls_livekit')],
    },
  )
  .post(
    '/:id/livekit-token',
    async ({ params, user, request }) =>
      createCommunicationCallLivekitTokenCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        id: params.id,
        requestOrigin: request.headers.get('origin') ?? new URL(request.url).origin,
      }),
    {
      params: CommunicationCallsIdParamSchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_calls_livekit')],
    },
  )
  .patch(
    '/:id/status',
    async ({ params, body, user }) =>
      updateCommunicationCallStatusCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        id: params.id,
        status: body.status,
      }),
    {
      params: CommunicationCallsIdParamSchema,
      body: CommunicationCallsUpdateStatusBodySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_calls_livekit')],
    },
  );
