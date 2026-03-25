import { t } from 'elysia';
import {
  NonEmptyString255,
  PaginationMetaSchema,
  PaginationRequestQueryProps,
  UUID,
} from '@/server/schemas/common';

const PermissionKey = t.String({ minLength: 3, maxLength: 120, pattern: '^Can[A-Za-z0-9]+$' });

export const ListRolesQuery = t.Object({
  ...PaginationRequestQueryProps,
  companyId: t.Optional(UUID),
  includeDeleted: t.Optional(t.Boolean()),
});

export const RoleDto = t.Object({
  id: UUID,
  companyId: UUID,
  name: NonEmptyString255,
  isDeleted: t.Boolean(),
  createdBy: UUID,
  createdAt: t.Union([t.String({ format: 'date-time' }), t.Null()]),
  updatedAt: t.Union([t.String({ format: 'date-time' }), t.Null()]),
  permissions: t.Array(PermissionKey),
});

export const ListRolesResponse = t.Object({
  data: t.Array(RoleDto),
  meta: PaginationMetaSchema,
});

export const CreateRoleBody = t.Object({
  name: NonEmptyString255,
  permissionKeys: t.Optional(t.Array(PermissionKey)),
});

export const UpdateRoleBody = t.Object({
  name: NonEmptyString255,
});

export const CreateRoleResponse = t.Object({
  id: UUID,
});

export const PermissionCatalogDto = t.Object({
  key: PermissionKey,
  description: t.String(),
  group: t.String(),
});

export const ListPermissionsResponse = t.Object({
  data: t.Array(PermissionCatalogDto),
});

export const SetRolePermissionsBody = t.Object({
  permissionKeys: t.Array(PermissionKey),
});

export const SetRolePermissionsResponse = t.Object({
  success: t.Boolean(),
});

export const GetRolePermissionsResponse = t.Object({
  permissionKeys: t.Array(PermissionKey),
});
