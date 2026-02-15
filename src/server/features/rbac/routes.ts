import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { PaginationQuery, UUID } from '@/server/schemas/common';

const notImplemented = (scope: string) => ({
  error: {
    status: HttpStatus.NOT_IMPLEMENTED,
    message: `${scope} is defined but not implemented yet.`,
  },
});

export const rbacRoutes = new Elysia({ name: 'rbac' })
  .get(
    '/roles',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('List roles');
    },
    {
      query: t.Intersect([
        PaginationQuery,
        t.Object({
          companyId: UUID,
          search: t.Optional(t.String()),
        }),
      ]),
      detail: { tags: ['RBAC'], summary: 'List roles', operationId: 'listRoles' },
    },
  )
  .post(
    '/roles',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Create role');
    },
    {
      body: t.Object({
        companyId: UUID,
        name: t.String({ minLength: 1, maxLength: 120 }),
        description: t.Optional(t.String()),
        createdBy: UUID,
      }),
      detail: { tags: ['RBAC'], summary: 'Create role', operationId: 'createRole' },
    },
  )
  .patch(
    '/roles/:id',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Update role');
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 120 })),
        description: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      detail: { tags: ['RBAC'], summary: 'Update role', operationId: 'updateRole' },
    },
  )
  .delete(
    '/roles/:id',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Delete role');
    },
    {
      params: t.Object({ id: UUID }),
      detail: { tags: ['RBAC'], summary: 'Delete role', operationId: 'deleteRole' },
    },
  )
  .get(
    '/permissions',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('List permissions');
    },
    {
      detail: { tags: ['RBAC'], summary: 'List permissions', operationId: 'listPermissions' },
    },
  )
  .put(
    '/roles/:id/permissions',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Set role permissions');
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        permissionKeys: t.Array(t.String({ minLength: 1, maxLength: 120 })),
        updatedBy: UUID,
      }),
      detail: {
        tags: ['RBAC'],
        summary: 'Set role permissions',
        operationId: 'setRolePermissions',
      },
    },
  )
  .post(
    '/users/:userId/roles',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Assign user role');
    },
    {
      params: t.Object({ userId: UUID }),
      body: t.Object({
        roleId: UUID,
        assignedBy: UUID,
      }),
      detail: { tags: ['RBAC'], summary: 'Assign user role', operationId: 'assignUserRole' },
    },
  )
  .delete(
    '/users/:userId/roles/:roleId',
    async ({ set }) => {
      set.status = HttpStatus.NOT_IMPLEMENTED;
      return notImplemented('Remove user role');
    },
    {
      params: t.Object({ userId: UUID, roleId: UUID }),
      query: t.Object({
        removedBy: UUID,
      }),
      detail: { tags: ['RBAC'], summary: 'Remove user role', operationId: 'removeUserRole' },
    },
  );
