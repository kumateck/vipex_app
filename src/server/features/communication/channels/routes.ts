import { Elysia } from 'elysia';
import { authPlugin, requireAuth, requireModuleEnabled } from '@/server/plugins/auth';
import { createCommunicationChannelsCtrl, listCommunicationChannelsCtrl } from './controller';
import {
  CommunicationChannelsCreateBodySchema,
  CommunicationChannelsListQuerySchema,
} from './schema';

export const CommunicationChannelsRoutes = new Elysia({ name: 'channels' })
  .use(authPlugin)
  .get('/', async ({ user }) => listCommunicationChannelsCtrl({ companyId: user!.companyId! }), {
    query: CommunicationChannelsListQuerySchema,
    beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
  })
  .post(
    '/',
    async ({ body, user }) =>
      createCommunicationChannelsCtrl({
        ...body,
        companyId: user!.companyId!,
        userId: user!.sub,
      }),
    {
      body: CommunicationChannelsCreateBodySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  );
