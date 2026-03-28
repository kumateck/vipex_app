import { Elysia, t } from 'elysia';
import { authPlugin, type AuthUser, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  createParcelContentSvc,
  createParcelDetailSvc,
  listParcelContentOptionsSvc,
  listParcelDetailOptionsSvc,
  updateParcelContentSvc,
  updateParcelDetailSvc,
} from './service';

function resolveCompanyId(user: AuthUser | null, fallback?: string) {
  return user?.companyId ?? fallback ?? '';
}

export const parcelMastersRoutes = new Elysia({ name: 'parcel-masters' })
  .use(authPlugin)
  .get(
    '/content-options',
    async ({ query, user }) =>
      listParcelContentOptionsSvc({
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        activeOnly: query.activeOnly ?? true,
      }),
    {
      query: t.Object({
        companyId: t.Optional(t.String()),
        activeOnly: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateBookingWithParcels)],
      detail: {
        tags: ['Parcel Masters'],
        summary: 'List parcel content options',
      },
    },
  )
  .get(
    '/detail-options',
    async ({ query, user }) =>
      listParcelDetailOptionsSvc({
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        activeOnly: query.activeOnly ?? true,
      }),
    {
      query: t.Object({
        companyId: t.Optional(t.String()),
        activeOnly: t.Optional(t.Boolean()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateBookingWithParcels)],
      detail: {
        tags: ['Parcel Masters'],
        summary: 'List parcel detail (packaging) options',
      },
    },
  )
  .post(
    '/contents',
    async ({ body, user }) =>
      createParcelContentSvc({
        companyId: resolveCompanyId(user as AuthUser | null, body.companyId),
        name: body.name,
        description: body.description ?? null,
        basePricePsw: body.basePricePsw,
        taxInclusive: body.taxInclusive,
        active: body.active,
        sortOrder: body.sortOrder,
        createdBy: (user as AuthUser | null)?.sub ?? null,
      }),
    {
      body: t.Object({
        companyId: t.Optional(t.String()),
        name: t.String({ minLength: 1, maxLength: 255 }),
        description: t.Optional(t.Union([t.String(), t.Null()])),
        basePricePsw: t.Number({ minimum: 0 }),
        taxInclusive: t.Boolean(),
        active: t.Optional(t.Boolean()),
        sortOrder: t.Optional(t.Number()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanManageCompanyModules)],
      detail: {
        tags: ['Parcel Masters'],
        summary: 'Create parcel content catalog item',
      },
    },
  )
  .patch(
    '/contents/:id',
    async ({ params, body, user }) =>
      updateParcelContentSvc({
        companyId: resolveCompanyId(user as AuthUser | null, body.companyId),
        id: params.id,
        name: body.name,
        description: body.description,
        basePricePsw: body.basePricePsw,
        taxInclusive: body.taxInclusive,
        active: body.active,
        sortOrder: body.sortOrder,
      }),
    {
      params: t.Object({ id: t.String({ minLength: 1 }) }),
      body: t.Object({
        companyId: t.Optional(t.String()),
        name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        description: t.Optional(t.Union([t.String(), t.Null()])),
        basePricePsw: t.Optional(t.Number({ minimum: 0 })),
        taxInclusive: t.Optional(t.Boolean()),
        active: t.Optional(t.Boolean()),
        sortOrder: t.Optional(t.Number()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanManageCompanyModules)],
      detail: {
        tags: ['Parcel Masters'],
        summary: 'Update parcel content catalog item',
      },
    },
  )
  .post(
    '/details',
    async ({ body, user }) =>
      createParcelDetailSvc({
        companyId: resolveCompanyId(user as AuthUser | null, body.companyId),
        name: body.name,
        description: body.description ?? null,
        active: body.active,
        sortOrder: body.sortOrder,
        createdBy: (user as AuthUser | null)?.sub ?? null,
      }),
    {
      body: t.Object({
        companyId: t.Optional(t.String()),
        name: t.String({ minLength: 1, maxLength: 255 }),
        description: t.Optional(t.Union([t.String(), t.Null()])),
        active: t.Optional(t.Boolean()),
        sortOrder: t.Optional(t.Number()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateBookingWithParcels)],
      detail: {
        tags: ['Parcel Masters'],
        summary: 'Create parcel detail (packaging) catalog item',
      },
    },
  )
  .patch(
    '/details/:id',
    async ({ params, body, user }) =>
      updateParcelDetailSvc({
        companyId: resolveCompanyId(user as AuthUser | null, body.companyId),
        id: params.id,
        name: body.name,
        description: body.description,
        active: body.active,
        sortOrder: body.sortOrder,
      }),
    {
      params: t.Object({ id: t.String({ minLength: 1 }) }),
      body: t.Object({
        companyId: t.Optional(t.String()),
        name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        description: t.Optional(t.Union([t.String(), t.Null()])),
        active: t.Optional(t.Boolean()),
        sortOrder: t.Optional(t.Number()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanManageCompanyModules)],
      detail: {
        tags: ['Parcel Masters'],
        summary: 'Update parcel detail (packaging) catalog item',
      },
    },
  );
