import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';

import { createUserSvc, getUserSvc, listUsersSvc, updateUserSvc } from './service';
import { decodeCursor, encodeCursor } from '@/server/utils/cursor';
import { PaginationQuery, NonEmpty255, UUID } from '@/server/schemas/common';

export const usersRoutes = new Elysia({ name: 'users' })
  .get(
    '/',
    async ({ query }) => {
      const limit = query.limit ? Math.min(Math.max(query.limit, 1), 100) : 25;
      const after = decodeCursor<{ createdAt: string; id: string }>(query.after || null);
      const { data, nextCursor } = await listUsersSvc({
        limit,
        after,
        companyId: query.companyId ?? null,
        branchId: query.branchId ?? null,
        roleId: query.roleId ?? null,
        status: query.status ?? null,
        search: query.search ?? null,
      });
      return {
        data: data.map((u) => ({
          ...u,
          createdAt: u.createdAt?.toISOString?.() ?? u.createdAt,
          updatedAt: u.updatedAt?.toISOString?.() ?? u.updatedAt,
        })),
        nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
      };
    },
    {
      query: t.Intersect([
        PaginationQuery,
        t.Object({
          companyId: t.Optional(UUID),
          branchId: t.Optional(UUID),
          roleId: t.Optional(UUID),
          status: t.Optional(t.Number()),
          search: t.Optional(t.String()),
        }),
      ]),
      detail: { tags: ['Users'], summary: 'List users', operationId: 'listUsers' },
    },
  )
  .get('/:id', async ({ params }) => getUserSvc(params.id), {
    params: t.Object({ id: UUID }),
    detail: { tags: ['Users'], summary: 'Get user', operationId: 'getUser' },
  })
  .post(
    '/',
    async ({ body, set }) => {
      const res = await createUserSvc(body);
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        fullname: NonEmpty255,
        telephone: NonEmpty255,
        email: NonEmpty255,
        status: t.Optional(t.Number()),
        roleId: UUID,
        companyId: UUID,
        branchId: UUID,
        createdBy: UUID,
      }),
      detail: { tags: ['Users'], summary: 'Create user', operationId: 'createUser' },
    },
  )
  .patch('/:id', async ({ params, body }) => updateUserSvc(params.id, body), {
    params: t.Object({ id: UUID }),
    body: t.Object({
      fullname: t.Optional(NonEmpty255),
      telephone: t.Optional(NonEmpty255),
      email: t.Optional(NonEmpty255),
      status: t.Optional(t.Number()),
      roleId: t.Optional(UUID),
      branchId: t.Optional(UUID),
    }),
    detail: { tags: ['Users'], summary: 'Update user', operationId: 'updateUser' },
  });
