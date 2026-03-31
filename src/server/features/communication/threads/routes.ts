import { Elysia } from 'elysia';
import type { AuthUser } from '@/server/plugins/auth';
import { authPlugin, requireAuth, requireModuleEnabled } from '@/server/plugins/auth';
import { createCommunicationThreadsCtrl, listCommunicationThreadsCtrl } from './controller';
import {
  CommunicationThreadsCreateBodySchema,
  CommunicationThreadsListQuerySchema,
} from './schema';

export const CommunicationThreadsRoutes = new Elysia({ name: 'threads' })
  .use(authPlugin)
  .get(
    '/',
    async ({ query, user }) =>
      listCommunicationThreadsCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        threadType: query.threadType ?? null,
      }),
    {
      query: CommunicationThreadsListQuerySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  )
  .post(
    '/',
    async ({ body, user }) =>
      createCommunicationThreadsCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        threadType: body.threadType as 'direct' | 'group' | 'channel',
        title: body.title ?? null,
        participantUserIds: body.participantUserIds,
        branchId: body.branchId ?? null,
        locationId: body.locationId ?? null,
      }),
    {
      body: CommunicationThreadsCreateBodySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  );
