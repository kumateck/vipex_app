import { Elysia, t } from 'elysia';
import { authPlugin, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { Forbidden } from '@/server/utils/http-error';
import { ContactListSchema, ContactUpdateSchema } from './schema';
import {
  getWebsiteContactRepo,
  listWebsiteContactsRepo,
  updateWebsiteContactRepo,
} from './repository';

const params = t.Object({ id: t.String({ minLength: 1, maxLength: 25 }) });
const readGuards = [requireAuth(), requirePermissions(PermissionKeys.CanReadCustomerMessages)];
const company = (companyId: string | null | undefined) => {
  if (!companyId) throw Forbidden('Company context is required');
  return companyId;
};

export const customerContactRoutes = new Elysia({ name: 'customer-contact' })
  .use(authPlugin)
  .onRequest(({ set }) => {
    set.headers['cache-control'] = 'no-store';
    set.headers['x-robots-tag'] = 'noindex, nofollow';
  })
  .get(
    '/',
    ({ query, user }) => listWebsiteContactsRepo({ ...query, companyId: company(user?.companyId) }),
    {
      query: ContactListSchema,
      beforeHandle: readGuards,
      detail: { tags: ['Customer messages'], summary: 'List customer website messages' },
    },
  )
  .get('/:id', ({ params, user }) => getWebsiteContactRepo(company(user?.companyId), params.id), {
    params,
    beforeHandle: readGuards,
    detail: {
      tags: ['Customer messages'],
      summary: 'Read a customer message and its handling history',
    },
  })
  .patch(
    '/:id',
    ({ params, body, user }) =>
      updateWebsiteContactRepo({
        ...body,
        id: params.id,
        companyId: company(user?.companyId),
        userId: user!.sub,
      }),
    {
      params,
      body: ContactUpdateSchema,
      beforeHandle: [...readGuards, requirePermissions(PermissionKeys.CanManageCustomerMessages)],
      detail: {
        tags: ['Customer messages'],
        summary: 'Update message status and add an internal note',
      },
    },
  );
