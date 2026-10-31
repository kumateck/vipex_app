import { callCenterParcelFilters } from '../call-center-scope';
import { Elysia, t } from 'elysia';
import {
  authPlugin,
  type AuthUser,
  requireAnyPermissions,
  requireAuth,
  requirePermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { UUID } from '../../../schemas/common';
import {
  getParcelByIdCtrl,
  getParcelDetailsCtrl,
  getParcelHistoryCtrl,
  listEligibleParcelCorrectionSessionsCtrl,
  listParcelReconciliationCasesCtrl,
  listParcelDispositionActionsCtrl,
  listParcelsCtrl,
  recordParcelDispositionActionCtrl,
} from '../parcels.controller';
import { resolveParcelSort } from '../parcel-sort';
import { getHomeDeliveryReceiptSvc } from '../home-delivery-receipt.service';
import { parseStatuses } from './helpers';
export const routes = new Elysia({ name: 'parcel-queries' })
  .use(authPlugin)
  .get(
    '/',
    async ({ query, user }) => {
      const authUser = user as AuthUser;
      return listParcelsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: resolveParcelSort(query.sort, query.createdAtOrder),
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        filters: {
          companyId: query.companyId ?? null,
          sourceId: query.sourceId ?? null,
          destinationId: query.destinationId ?? null,
          locationId: query.locationId ?? null,
          status: query.status ?? null,
          statuses: parseStatuses(query.statuses),
          senderPaid: query.senderPaid ?? null,
          paymentType: query.paymentType ?? null,
          hasPickupQueue: query.hasPickupQueue ?? null,
          agedOnly: query.agedOnly ?? null,
          storageChargeAccruing: query.storageChargeAccruing ?? null,
          cashierCollectionRequired: query.cashierCollectionRequired ?? null,
          received: query.received ?? null,
          includeDeleted: query.includeDeleted ?? null,
          assignedToUserId: query.assignedToCurrentUser ? authUser.sub : null,
          callCenterUncalledOnly: query.callCenterUncalledOnly ?? false,
          sentDate: query.sentDate ?? null,
          consignmentNumber: query.consignmentNumber ?? null,
          ...(query.assignedToCurrentUser ? callCenterParcelFilters(authUser) : {}),
        },
      });
    },
    {
      query: t.Object({
        page: t.Optional(t.Number({ minimum: 1 })),
        pageSize: t.Optional(t.Number({ minimum: 1, maximum: 200 })),
        search: t.Optional(t.String()),
        sort: t.Optional(
          t.Array(
            t.Object({
              field: t.String({ minLength: 1, maxLength: 100 }),
              direction: t.Union([t.Literal('asc'), t.Literal('desc')]),
            }),
            { minItems: 1 },
          ),
        ),
        createdAtOrder: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')])),
        dateFrom: t.Optional(t.String({ format: 'date-time' })),
        dateTo: t.Optional(t.String({ format: 'date-time' })),
        companyId: t.Optional(UUID),
        sourceId: t.Optional(UUID),
        destinationId: t.Optional(UUID),
        locationId: t.Optional(UUID),
        status: t.Optional(t.Number()),
        statuses: t.Optional(t.Union([t.Array(t.Number()), t.String()])),
        senderPaid: t.Optional(t.Boolean()),
        paymentType: t.Optional(
          t.Union([t.Literal('paid'), t.Literal('to_be_paid'), t.Literal('partial')]),
        ),
        hasPickupQueue: t.Optional(t.Boolean()),
        agedOnly: t.Optional(t.Boolean()),
        storageChargeAccruing: t.Optional(t.Boolean()),
        cashierCollectionRequired: t.Optional(t.Boolean()),
        received: t.Optional(t.Boolean()),
        includeDeleted: t.Optional(t.Boolean()),
        assignedToCurrentUser: t.Optional(t.Boolean()),
        callCenterUncalledOnly: t.Optional(t.Boolean()),
        sentDate: t.Optional(t.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' })),
        consignmentNumber: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
      }),
      beforeHandle: [
        requireAuth(),
        requireAnyPermissions(
          PermissionKeys.CanReadParcels,
          PermissionKeys.CanReadCallCenterAssignment,
        ),
      ],
      detail: { tags: ['Shipments'], summary: 'List/search parcels' },
    },
  )
  .get(
    '/reconciliation-cases',
    async ({ query, user }) => {
      const authUser = user as AuthUser;
      return listParcelReconciliationCasesCtrl({
        companyId: query.companyId ?? authUser.companyId ?? '',
        statuses: parseStatuses(query.statuses),
        branchId: query.branchId ?? authUser.branchId ?? null,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
        search: query.search ?? null,
      });
    },
    {
      query: t.Object({
        companyId: t.Optional(UUID),
        branchId: t.Optional(t.Union([UUID, t.Null()])),
        statuses: t.Optional(t.Union([t.Array(t.Number()), t.String()])),
        page: t.Optional(t.Number({ minimum: 1 })),
        pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        search: t.Optional(t.String()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcelReconciliation)],
      detail: { tags: ['Shipments'], summary: 'List parcel reconciliation cases' },
    },
  )
  .get(
    '/reconciliation-cases/eligible-sessions/:parcelId',
    async ({ params, user }) =>
      listEligibleParcelCorrectionSessionsCtrl({
        companyId: (user as AuthUser).companyId ?? '',
        parcelId: params.parcelId,
      }),
    {
      params: t.Object({ parcelId: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanRequestParcelReconciliation),
      ],
      detail: { tags: ['Shipments'], summary: 'List eligible original cashier sessions' },
    },
  )
  .get('/:id', async ({ params }) => getParcelByIdCtrl(params.id), {
    params: t.Object({ id: UUID }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcels)],
    detail: { tags: ['Shipments'], summary: 'Get parcel' },
  })
  .get(
    '/:id/details',
    async ({ params, user }) =>
      getParcelDetailsCtrl(params.id, { companyId: (user as AuthUser).companyId ?? null }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcels)],
      detail: {
        tags: ['Shipments'],
        summary: 'Get parcel full details (payments, delivery, consignments)',
      },
    },
  )
  .get(
    '/:id/history',
    async ({ params, user }) =>
      getParcelHistoryCtrl(params.id, { companyId: (user as AuthUser).companyId ?? null }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcels)],
      detail: { tags: ['Shipments'], summary: 'Get parcel history timeline (who did what, when)' },
    },
  )
  .get(
    '/:id/home-delivery-receipt',
    ({ params, user }) => {
      const authUser = user as AuthUser;
      return getHomeDeliveryReceiptSvc({
        parcelId: params.id,
        companyId: authUser.companyId ?? null,
        branchId: authUser.branchId ?? null,
      });
    },
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanDispatchForDelivery)],
      detail: { tags: ['Shipments'], summary: 'Calculate home delivery A5 receipt for a parcel' },
    },
  )
  .get(
    '/:id/disposition-actions',
    async ({ params }) => listParcelDispositionActionsCtrl(params.id),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcels)],
      detail: { tags: ['Shipments'], summary: 'List parcel disposition actions' },
    },
  )
  .post(
    '/:id/disposition-actions',
    async ({ params, body, user }) =>
      recordParcelDispositionActionCtrl({
        parcelId: params.id,
        actorUserId: (user as AuthUser).sub,
        actionType: (body as { actionType: number }).actionType,
        notes: (body as { notes?: string | null }).notes ?? null,
        warehouseId: (body as { warehouseId?: string | null }).warehouseId ?? null,
        recoveredAmountCedis:
          (body as { recoveredAmountCedis?: number | string | null }).recoveredAmountCedis ?? null,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        actionType: t.Number(),
        notes: t.Optional(t.Union([t.String({ maxLength: 1000 }), t.Null()])),
        warehouseId: t.Optional(t.Union([UUID, t.Null()])),
        recoveredAmountCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateParcels)],
      detail: { tags: ['Shipments'], summary: 'Record parcel disposition action' },
    },
  );
