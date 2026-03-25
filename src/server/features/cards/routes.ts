import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { PaginationRequestQueryProps, NonEmpty255, UUID } from '@/server/schemas/common';
import { authPlugin, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { getCardByIdCtrl, listCardsCtrl } from './controller';

import { createCardSvc, deleteCardSvc, updateCardSvc } from './service';

export const cardsRoutes = new Elysia({ name: 'cards' })
  .use(authPlugin)
  .get(
    '/',
    async ({ query, user }) =>
      listCardsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: user!.companyId!,
          includeDeleted: query.includeDeleted ?? null,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        companyId: t.Optional(UUID),
        includeDeleted: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCards)],
      detail: { tags: ['Cards'], summary: 'List cards', operationId: 'listCards' },
    },
  )
  .get('/:id', async ({ params }) => getCardByIdCtrl(params.id), {
    params: t.Object({ id: UUID }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadCards)],
  })
  .post(
    '/',
    async ({ body, set }) => {
      const res = await createCardSvc(body);
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({ companyId: UUID, name: NonEmpty255, createdBy: UUID }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateCards)],
      detail: { tags: ['Cards'], summary: 'Create card', operationId: 'createCard' },
    },
  )
  .patch('/:id', async ({ params, body }) => updateCardSvc(params.id, body), {
    params: t.Object({ id: UUID }),
    body: t.Object({ name: t.Optional(NonEmpty255) }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateCards)],
    detail: { tags: ['Cards'], summary: 'Update card', operationId: 'updateCard' },
  })
  .delete('/:id', async ({ params }) => deleteCardSvc(params.id), {
    params: t.Object({ id: UUID }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanDeleteCards)],
  });
