import { Elysia } from 'elysia';
import { t } from '../../schemas/common';
import { decodeCursor } from '../../utils/cursor';
import { listUsersCtrl, getUserByIdCtrl, createUserCtrl } from './controller';
import {
  CreateUserBody,
  CreateUserResponse,
  GetUserParams,
  ListUsersQuery,
  ListUsersResponse,
} from './schemas';

export const usersRoutes = new Elysia({ name: 'users' })
  // List users with keyset pagination
  .get(
    '/',
    async ({ query }) => {
      const limit = query.limit ? Number(query.limit) : 25;
      const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 25;
      const after = decodeCursor<{ createdAt: string; id: string }>(query.after || null);
      const res = await listUsersCtrl({ limit: safeLimit, after });
      return res;
    },
    {
      query: ListUsersQuery,
      response: ListUsersResponse,
      detail: {
        tags: ['Users'],
        summary: 'List users',
        description:
          'Returns a paginated list of users using keyset pagination. Use the nextCursor to fetch subsequent pages.',
        operationId: 'listUsers',
      },
    },
  )
  // Get by id
  .get(
    '/:id',
    async ({ params }) => {
      return await getUserByIdCtrl(params.id);
    },
    {
      params: GetUserParams,
      response: t.Ref('UserDtoRef'),
      detail: {
        tags: ['Users'],
        summary: 'Get user by ID',
        operationId: 'getUserById',
      },
    },
  )
  // Create user
  .post(
    '/',
    async ({ body, set }) => {
      const created = await createUserCtrl(body);
      set.status = 201;
      return created;
    },
    {
      body: CreateUserBody,
      response: { 201: CreateUserResponse },
      detail: {
        tags: ['Users'],
        summary: 'Create a new user',
        operationId: 'createUser',
      },
    },
  )
  // Shared ref for User DTO (re-usable in docs)
  .model({
    UserDtoRef: t.Object({
      id: t.String({ format: 'uuid' }),
      fullname: t.String({ minLength: 1, maxLength: 255 }),
      email: t.String({ format: 'email', maxLength: 255 }),
      telephone: t.String({ minLength: 6, maxLength: 30 }),
      status: t.String({ minLength: 1, maxLength: 20 }),
      companyId: t.String({ format: 'uuid' }),
      branchId: t.String({ format: 'uuid' }),
      createdAt: t.Union([t.String({ format: 'date-time' }), t.Null()]),
    }),
  });
