import { Elysia } from 'elysia';
import type { AuthUser } from '@/server/plugins/auth';
import { authPlugin, requireAuth, requireModuleEnabled } from '@/server/plugins/auth';
import { createCommunicationMessagesCtrl, listCommunicationMessagesCtrl } from './controller';
import {
  CommunicationMessagesCreateBodySchema,
  CommunicationMessagesListQuerySchema,
} from './schema';

export const CommunicationMessagesRoutes = new Elysia({ name: 'messages' })
  .use(authPlugin)
  .get(
    '/',
    async ({ query, user }) =>
      listCommunicationMessagesCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        threadId: query.threadId,
        limit: typeof query.limit === 'number' ? query.limit : undefined,
      }),
    {
      query: CommunicationMessagesListQuerySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  )
  .post(
    '/',
    async ({ body, user }) =>
      createCommunicationMessagesCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        threadId: body.threadId,
        body: body.body ?? null,
        messageType: body.messageType ?? null,
        metadataJson: body.metadataJson ?? null,
      }),
    {
      body: CommunicationMessagesCreateBodySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  );
