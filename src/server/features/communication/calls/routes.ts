import { Elysia } from 'elysia';
import type { AuthUser } from '@/server/plugins/auth';
import { authPlugin, requireAuth, requireModuleEnabled } from '@/server/plugins/auth';
import { createCommunicationCallsCtrl, listCommunicationCallsCtrl } from './controller';
import { CommunicationCallsCreateBodySchema, CommunicationCallsListQuerySchema } from './schema';

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
  );
