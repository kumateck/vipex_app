import { Elysia } from 'elysia';
import type { AuthUser } from '@/server/plugins/auth';
import { authPlugin, requireAuth, requireModuleEnabled } from '@/server/plugins/auth';
import { createCommunicationPresenceCtrl, listCommunicationPresenceCtrl } from './controller';
import {
  CommunicationPresenceCreateBodySchema,
  CommunicationPresenceListQuerySchema,
} from './schema';

export const CommunicationPresenceRoutes = new Elysia({ name: 'presence' })
  .use(authPlugin)
  .get(
    '/',
    async ({ user }) =>
      listCommunicationPresenceCtrl({ companyId: (user as AuthUser | null)?.companyId ?? '' }),
    {
      query: CommunicationPresenceListQuerySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  )
  .post(
    '/',
    async ({ body, user }) =>
      createCommunicationPresenceCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        status: body.status,
      }),
    {
      body: CommunicationPresenceCreateBodySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  );
