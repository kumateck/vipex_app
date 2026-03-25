import { Elysia, t } from 'elysia';
import { HttpStatus } from '@/server/utils/http-status';
import { authPlugin, requireAuth, requireHeadOffice, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys, type PermissionKey } from '@/shared/permissions/constants';
import {
  createRoleCtrl,
  deleteRoleCtrl,
  getRolePermissionsCtrl,
  listPermissionsCtrl,
  listRoleOptionsCtrl,
  listRolesCtrl,
  setRolePermissionsCtrl,
  updateRoleCtrl,
} from './controller';
import {
  CreateRoleBody,
  CreateRoleResponse,
  GetRolePermissionsResponse,
  ListPermissionsResponse,
  ListRolesQuery,
  ListRolesResponse,
  SetRolePermissionsBody,
  SetRolePermissionsResponse,
  UpdateRoleBody,
} from './schemas';

export const rbacRoutes = new Elysia({ name: 'rbac' })
  .use(authPlugin)
  .get(
    '/roles/options',
    async ({ query, user }) => {
      const companyId = query.companyId ?? user!.companyId;
      return listRoleOptionsCtrl({
        companyId: companyId!,
        search: query.search ?? null,
        includeDeleted: query.includeDeleted ?? null,
      });
    },
    {
      query: t.Object({
        companyId: t.Optional(t.String({ minLength: 1, maxLength: 25 })),
        search: t.Optional(t.String()),
        includeDeleted: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadRoles)],
      detail: { tags: ['RBAC'], summary: 'List role options', operationId: 'listRoleOptions' },
    },
  )
  .get(
    '/roles',
    async ({ query, user }) => {
      const companyId = query.companyId ?? user!.companyId;
      return listRolesCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: companyId!,
          includeDeleted: query.includeDeleted ?? null,
        },
      });
    },
    {
      query: ListRolesQuery,
      response: ListRolesResponse,
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadRoles)],
      detail: { tags: ['RBAC'], summary: 'List roles', operationId: 'listRoles' },
    },
  )
  .post(
    '/roles',
    async ({ body, user, set }) => {
      const res = await createRoleCtrl({
        companyId: user!.companyId!,
        createdBy: user!.sub,
        name: body.name,
        permissionKeys: (body.permissionKeys ?? []) as PermissionKey[],
      });
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: CreateRoleBody,
      response: CreateRoleResponse,
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateRoles), requireHeadOffice()],
      detail: { tags: ['RBAC'], summary: 'Create role', operationId: 'createRole' },
    },
  )
  .patch(
    '/roles/:id',
    async ({ params, body, user }) => {
      return updateRoleCtrl(params.id, user!.companyId!, body, user!.sub);
    },
    {
      params: t.Object({ id: t.String({ minLength: 1, maxLength: 25 }) }),
      body: UpdateRoleBody,
      response: CreateRoleResponse,
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateRoles), requireHeadOffice()],
      detail: { tags: ['RBAC'], summary: 'Update role name', operationId: 'updateRole' },
    },
  )
  .delete(
    '/roles/:id',
    async ({ params, user }) => {
      return deleteRoleCtrl(params.id, user!.companyId!, user!.sub);
    },
    {
      params: t.Object({ id: t.String({ minLength: 1, maxLength: 25 }) }),
      response: t.Object({ success: t.Boolean() }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanDeleteRoles), requireHeadOffice()],
      detail: { tags: ['RBAC'], summary: 'Delete role', operationId: 'deleteRole' },
    },
  )
  .get(
    '/permissions',
    async ({ user }) => {
      return listPermissionsCtrl(user!.companyId!, user!.sub);
    },
    {
      response: ListPermissionsResponse,
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadPermissions)],
      detail: { tags: ['RBAC'], summary: 'List permission constants', operationId: 'listPermissions' },
    },
  )
  .get(
    '/roles/:id/permissions',
    async ({ params, user }) => {
      return getRolePermissionsCtrl(params.id, user!.companyId!);
    },
    {
      params: t.Object({ id: t.String({ minLength: 1, maxLength: 25 }) }),
      response: GetRolePermissionsResponse,
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadRoles)],
      detail: { tags: ['RBAC'], summary: 'Get role permissions', operationId: 'getRolePermissions' },
    },
  )
  .put(
    '/roles/:id/permissions',
    async ({ params, body, user }) => {
      return setRolePermissionsCtrl({
        roleId: params.id,
        companyId: user!.companyId!,
        createdBy: user!.sub,
        permissionKeys: body.permissionKeys as PermissionKey[],
      });
    },
    {
      params: t.Object({ id: t.String({ minLength: 1, maxLength: 25 }) }),
      body: SetRolePermissionsBody,
      response: SetRolePermissionsResponse,
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanManageRolePermissions), requireHeadOffice()],
      detail: { tags: ['RBAC'], summary: 'Set role permissions', operationId: 'setRolePermissions' },
    },
  );
