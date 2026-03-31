import { Elysia } from 'elysia';
import type { AuthUser } from '@/server/plugins/auth';
import { authPlugin, requireAuth, requireModuleEnabled } from '@/server/plugins/auth';
import { createCommunicationGroupsCtrl, listCommunicationGroupsCtrl } from './controller';
import { CommunicationGroupsCreateBodySchema, CommunicationGroupsListQuerySchema } from './schema';

export const CommunicationGroupsRoutes = new Elysia({ name: 'groups' })
  .use(authPlugin)
  .get(
    '/',
    async ({ user }) =>
      listCommunicationGroupsCtrl({ companyId: (user as AuthUser | null)?.companyId ?? '' }),
    {
      query: CommunicationGroupsListQuerySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  )
  .post(
    '/',
    async ({ body, user }) =>
      createCommunicationGroupsCtrl({
        companyId: (user as AuthUser | null)?.companyId ?? '',
        userId: (user as AuthUser | null)?.sub ?? '',
        name: body.name,
        description: body.description ?? null,
        branchId: body.branchId ?? null,
        locationId: body.locationId ?? null,
      }),
    {
      body: CommunicationGroupsCreateBodySchema,
      beforeHandle: [requireAuth(), requireModuleEnabled('communication_internal')],
    },
  );
