import { Elysia, t } from 'elysia';
import { HttpStatus } from '@/server/utils/http-status';
import { NonEmpty255, PaginationRequestQueryProps, UUID } from '@/server/schemas/common';
import {
  authPlugin,
  type AuthUser,
  requireAuth,
  requireModuleEnabled,
  requirePermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  approvePurchaseRequestCtrl,
  createProcurementSupplierCtrl,
  createPurchaseRequestCtrl,
  listProcurementSupplierOptionsCtrl,
  listProcurementSuppliersCtrl,
  listPurchaseRequestsCtrl,
  rejectPurchaseRequestCtrl,
  updateProcurementSupplierCtrl,
} from './controller';

export const procurementRoutes = new Elysia({ name: 'procurement' })
  .use(authPlugin)
  .get(
    '/suppliers/options',
    async ({ query, user }) =>
      listProcurementSupplierOptionsCtrl({
        companyId: (user as AuthUser).companyId!,
        search: query.search ?? null,
        isActive: query.isActive ?? null,
      }),
    {
      query: t.Object({
        search: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadProcurement),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'List procurement supplier options' },
    },
  )
  .get(
    '/suppliers',
    async ({ query, user }) =>
      listProcurementSuppliersCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          search: query.search,
          isActive: query.isActive ?? undefined,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        isActive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadProcurement),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'List procurement suppliers' },
    },
  )
  .post(
    '/suppliers',
    async ({ body, set, user }) => {
      const result = await createProcurementSupplierCtrl({
        companyId: (user as AuthUser).companyId!,
        createdBy: (user as AuthUser).sub,
        name: body.name,
        contactPerson: body.contactPerson ?? null,
        email: body.email ?? null,
        telephone: body.telephone ?? null,
        address: body.address ?? null,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        name: NonEmpty255,
        contactPerson: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        email: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        telephone: t.Optional(t.Union([t.String({ maxLength: 50 }), t.Null()])),
        address: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateProcurementSuppliers),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Create procurement supplier' },
    },
  )
  .patch(
    '/suppliers/:id',
    async ({ params, body, user }) =>
      updateProcurementSupplierCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        actorUserId: (user as AuthUser).sub,
        patch: {
          name: body.name,
          contactPerson: body.contactPerson,
          email: body.email,
          telephone: body.telephone,
          address: body.address,
          isActive: body.isActive,
        },
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        name: t.Optional(NonEmpty255),
        contactPerson: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        email: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        telephone: t.Optional(t.Union([t.String({ maxLength: 50 }), t.Null()])),
        address: t.Optional(t.Union([t.String(), t.Null()])),
        isActive: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanUpdateProcurementSuppliers),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Update procurement supplier' },
    },
  )
  .get(
    '/purchase-requests',
    async ({ query, user }) =>
      listPurchaseRequestsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: (user as AuthUser).companyId!,
          search: query.search,
          status: query.status,
          supplierId: query.supplierId,
          pendingOnly: query.pendingOnly ?? undefined,
        },
      }),
    {
      query: t.Object({
        ...PaginationRequestQueryProps,
        status: t.Optional(t.Number()),
        supplierId: t.Optional(UUID),
        pendingOnly: t.Optional(t.Boolean()),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadProcurement),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'List purchase requests' },
    },
  )
  .post(
    '/purchase-requests',
    async ({ body, set, user }) => {
      const result = await createPurchaseRequestCtrl({
        companyId: (user as AuthUser).companyId!,
        requestedByUserId: (user as AuthUser).sub,
        branchId: body.branchId ?? null,
        supplierId: body.supplierId ?? null,
        title: body.title,
        description: body.description ?? null,
        amountPsw: body.amountPsw,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        branchId: t.Optional(t.Union([UUID, t.Null()])),
        supplierId: t.Optional(t.Union([UUID, t.Null()])),
        title: NonEmpty255,
        description: t.Optional(t.Union([t.String(), t.Null()])),
        amountPsw: t.Number({ minimum: 0 }),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateProcurementPurchaseRequests),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Create purchase request' },
    },
  )
  .post(
    '/purchase-requests/:id/approve',
    async ({ params, user }) =>
      approvePurchaseRequestCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        approverUserId: (user as AuthUser).sub,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveProcurementPurchaseRequests),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Approve purchase request' },
    },
  )
  .post(
    '/purchase-requests/:id/reject',
    async ({ params, body, user }) =>
      rejectPurchaseRequestCtrl({
        id: params.id,
        companyId: (user as AuthUser).companyId!,
        approverUserId: (user as AuthUser).sub,
        rejectionReason: body.rejectionReason,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        rejectionReason: NonEmpty255,
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveProcurementPurchaseRequests),
        requireModuleEnabled('procurement'),
      ],
      detail: { tags: ['Procurement'], summary: 'Reject purchase request' },
    },
  );
