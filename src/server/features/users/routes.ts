import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { authPlugin, type AuthUser, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { BRANCH_TYPES, CASHIER_TYPES, USER_TYPES } from '@/shared/access/constants';
import { BranchType, UserType, type CashierType } from '@/db/schemas/enums';
import { Forbidden } from '@/server/utils/http-error';

import { createUserSvc, getUserSvc, updateUserSvc } from './service';
import { listUserOptionsCtrl, listUsersCtrl } from './controller';
import { PaginationRequestQueryProps, NonEmpty255, UUID } from '@/server/schemas/common';

function parseOptionalUserType(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export const usersRoutes = new Elysia({ name: 'users' })
  .use(authPlugin)
  .get(
    '/options',
    async ({ query, user }) => {
      const authUser = user as AuthUser;
      const isHeadOffice = authUser.branchType === BranchType.HEADOFFICE;

      return listUserOptionsCtrl({
        companyId: authUser.companyId ?? null,
        branchId: isHeadOffice ? (query.branchId ?? null) : (authUser.branchId ?? null),
        locationId: isHeadOffice ? (query.locationId ?? null) : (query.locationId ?? null),
        roleId: query.roleId ?? null,
        userType: parseOptionalUserType(query.userType),
        status: query.status ?? null,
        search: query.search ?? null,
      });
    },
    {
      query: t.Object({
        companyId: t.Optional(UUID),
        branchId: t.Optional(UUID),
        locationId: t.Optional(UUID),
        roleId: t.Optional(UUID),
        userType: t.Optional(t.Union([...USER_TYPES.map((value) => t.Literal(value)), t.String()])),
        status: t.Optional(t.Number()),
        search: t.Optional(t.String()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadUsers)],
      detail: { tags: ['Users'], summary: 'List user options', operationId: 'listUserOptions' },
    },
  )
  .get(
    '/',
    async ({ query, user }) => {
      const authUser = user as AuthUser;
      const isHeadOffice = authUser.branchType === BranchType.HEADOFFICE;

      return listUsersCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: authUser.companyId ?? null,
          branchId: isHeadOffice ? (query.branchId ?? null) : (authUser.branchId ?? null),
          locationId: authUser.locationId ?? null,
          roleId: query.roleId ?? null,
          userType: parseOptionalUserType(query.userType),
          status: query.status ?? null,
          statuses: query.statuses ?? null,
        },
      });
    },
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        companyId: t.Optional(UUID),
        branchId: t.Optional(UUID),
        locationId: t.Optional(UUID),
        roleId: t.Optional(UUID),
        userType: t.Optional(t.Union([...USER_TYPES.map((value) => t.Literal(value)), t.String()])),
        status: t.Optional(t.Number()),
        statuses: t.Optional(t.String()),
        search: t.Optional(t.String()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadUsers)],
      detail: { tags: ['Users'], summary: 'List users', operationId: 'listUsers' },
    },
  )
  .get('/:id', async ({ params }) => getUserSvc(params.id), {
    params: t.Object({ id: UUID }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadUsers)],
    detail: { tags: ['Users'], summary: 'Get user', operationId: 'getUser' },
  })
  .post(
    '/',
    async ({ body, set, user }) => {
      const authUser = user as AuthUser;
      if (!authUser.companyId || !authUser.sub) {
        throw Forbidden('Authenticated actor context is incomplete');
      }
      if (
        authUser.branchType === null ||
        authUser.branchType === undefined ||
        !BRANCH_TYPES.includes(authUser.branchType as (typeof BRANCH_TYPES)[number])
      ) {
        throw Forbidden('Authenticated actor branch type is invalid');
      }

      const payload = body as {
        fullname: string;
        telephone: string;
        email: string;
        status?: number;
        roleId: string;
        branchId: string;
        locationId?: string | null;
        userType: number;
        cashierType?: CashierType | null;
        sendInvite?: boolean;
      };

      const cashierType =
        payload.userType === UserType.CASHIER ? (payload.cashierType ?? null) : null;

      const res = await createUserSvc({
        fullname: payload.fullname,
        telephone: payload.telephone,
        email: payload.email,
        status: payload.status,
        roleId: payload.roleId,
        companyId: authUser.companyId,
        branchId: payload.branchId,
        locationId: payload.locationId ?? null,
        userType: payload.userType,
        cashierType,
        createdBy: authUser.sub,
        sendInvite: payload.sendInvite,
        actor: {
          companyId: authUser.companyId ?? null,
          branchId: authUser.branchId ?? null,
          branchType: authUser.branchType ?? null,
          locationId: authUser.locationId ?? null,
        },
      });
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
        branchId: UUID,
        locationId: t.Optional(t.Union([UUID, t.Null()])),
        userType: t.Union(USER_TYPES.map((value) => t.Literal(value))),
        cashierType: t.Optional(
          t.Union([...CASHIER_TYPES.map((value) => t.Literal(value)), t.Null()]),
        ),
        sendInvite: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateUsers)],
      detail: { tags: ['Users'], summary: 'Create user', operationId: 'createUser' },
    },
  )
  .patch(
    '/:id',
    async ({ params, body }) => {
      const payload = body as {
        fullname?: string;
        telephone?: string;
        email?: string;
        status?: number;
        roleId?: string;
        branchId?: string;
        locationId?: string | null;
        userType?: number;
        cashierType?: CashierType | null;
      };

      const userType = payload.userType;
      const cashierType =
        userType === undefined
          ? payload.cashierType
          : userType === UserType.CASHIER
            ? (payload.cashierType ?? null)
            : null;

      return updateUserSvc(params.id, {
        ...payload,
        cashierType,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        fullname: t.Optional(NonEmpty255),
        telephone: t.Optional(NonEmpty255),
        email: t.Optional(NonEmpty255),
        status: t.Optional(t.Number()),
        roleId: t.Optional(UUID),
        branchId: t.Optional(UUID),
        locationId: t.Optional(t.Union([UUID, t.Null()])),
        userType: t.Optional(t.Union(USER_TYPES.map((value) => t.Literal(value)))),
        cashierType: t.Optional(
          t.Union([...CASHIER_TYPES.map((value) => t.Literal(value)), t.Null()]),
        ),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateUsers)],
      detail: { tags: ['Users'], summary: 'Update user', operationId: 'updateUser' },
    },
  );
