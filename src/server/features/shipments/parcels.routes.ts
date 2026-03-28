import { Elysia, t } from 'elysia';
import {
  authPlugin,
  type AuthUser,
  requireAnyPermissions,
  requireAuth,
  requirePermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { HttpStatus } from '../../utils/http-status';
import { UUID } from '../../schemas/common';
import {
  createParcelCtrl,
  getParcelByIdCtrl,
  getParcelDetailsCtrl,
  listParcelsCtrl,
  logParcelDiscrepancyCtrl,
  markParcelReceivedCtrl,
  setPlannedToBePaidCtrl,
  softDeleteParcelCtrl,
  updateParcelCtrl,
} from './parcels.controller';

function parseStatuses(value: string | number[] | undefined): number[] | null {
  if (Array.isArray(value)) {
    const parsed = value.map((entry) => Number(entry)).filter((entry) => Number.isFinite(entry));
    return parsed.length ? parsed : null;
  }

  if (typeof value === 'string') {
    const parsed = value
      .split(',')
      .map((entry) => Number(entry.trim()))
      .filter((entry) => Number.isFinite(entry));
    return parsed.length ? parsed : null;
  }

  return null;
}

export const parcelsRoutes = new Elysia({ name: 'parcels' })
  .use(authPlugin)
  .get(
    '/',
    async ({ query }) =>
      listParcelsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        sort: query.sort,
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
          received: query.received ?? null,
          includeDeleted: query.includeDeleted ?? null,
        },
      }),
    {
      query: t.Object({
        page: t.Optional(t.Number({ minimum: 1 })),
        pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
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
        dateFrom: t.Optional(t.String({ format: 'date-time' })),
        dateTo: t.Optional(t.String({ format: 'date-time' })),
        companyId: t.Optional(UUID),
        sourceId: t.Optional(UUID),
        destinationId: t.Optional(UUID),
        locationId: t.Optional(UUID),
        status: t.Optional(t.Number()),
        statuses: t.Optional(t.Union([t.Array(t.Number()), t.String()])),
        senderPaid: t.Optional(t.Boolean()),
        received: t.Optional(t.Boolean()),
        includeDeleted: t.Optional(t.Boolean()),
      }),
      detail: { tags: ['Shipments'], summary: 'List/search parcels' },
    },
  )
  .get('/:id', async ({ params }) => getParcelByIdCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: { tags: ['Shipments'], summary: 'Get parcel' },
  })
  .get('/:id/details', async ({ params }) => getParcelDetailsCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: {
      tags: ['Shipments'],
      summary: 'Get parcel full details (payments, delivery, consignments)',
    },
  })
  .post(
    '/',
    async ({ body, set }) => {
      const res = await createParcelCtrl(
        body as {
          companyId: string;
          sourceId: string;
          destinationId: string;
          bookingId: string;
          bookingCode: string;
          trackingCode: string;
          senderId: string;
          receiverId: string;
          status: number;
          parcelDetails: string;
          parcelContent: string;
          parcelValueCedis?: number | string | null;
          chargeCedis?: number | string | null;
          plannedToBePaidCedis?: number | string | null;
          method: number;
          createdBy?: string | null;
          cashierSessionId?: string | null;
        },
      );
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        companyId: UUID,
        sourceId: UUID,
        destinationId: UUID,
        bookingId: UUID,
        bookingCode: t.String(),
        trackingCode: t.String(),
        senderId: UUID,
        receiverId: UUID,
        status: t.Number(),
        parcelDetails: t.String({ minLength: 1, maxLength: 255 }),
        parcelContent: t.String({ minLength: 1, maxLength: 255 }),
        parcelValueCedis: t.Optional(t.Union([t.Number(), t.String()])),
        chargeCedis: t.Optional(t.Union([t.Number(), t.String()])),
        plannedToBePaidCedis: t.Optional(t.Union([t.Number(), t.String()])),
        method: t.Number(),
        createdBy: t.Optional(UUID),
        cashierSessionId: t.Optional(UUID),
      }),
      detail: { tags: ['Shipments'], summary: 'Create parcel' },
    },
  )
  .patch(
    '/:id',
    async ({ params, body }) =>
      updateParcelCtrl(
        params.id,
        body as {
          status?: number;
          parcelDetails?: string;
          parcelContent?: string;
          secondReceiverId?: string | null;
          cardId?: string | null;
          cardNumber?: string | null;
          secondCardId?: string | null;
          secondCardNumber?: string | null;
          confirmedBy?: string | null;
          confirmedAt?: string | null;
          parcelValueCedis?: number | string | null;
          chargeCedis?: number | string | null;
          pickupLocationId?: string | null;
          method?: number;
          taxReportConfirmation?: boolean;
        },
      ),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        status: t.Optional(t.Number()),
        parcelDetails: t.Optional(t.String()),
        parcelContent: t.Optional(t.String()),
        secondReceiverId: t.Optional(t.Union([UUID, t.Null()])),
        cardId: t.Optional(t.Union([UUID, t.Null()])),
        cardNumber: t.Optional(t.Union([t.String(), t.Null()])),
        secondCardId: t.Optional(t.Union([UUID, t.Null()])),
        secondCardNumber: t.Optional(t.Union([t.String(), t.Null()])),
        confirmedBy: t.Optional(t.Union([UUID, t.Null()])),
        confirmedAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
        parcelValueCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
        chargeCedis: t.Optional(t.Union([t.Number(), t.String(), t.Null()])),
        pickupLocationId: t.Optional(t.Union([UUID, t.Null()])),
        method: t.Optional(t.Number()),
        taxReportConfirmation: t.Optional(t.Boolean()),
      }),
      detail: { tags: ['Shipments'], summary: 'Update parcel' },
    },
  )
  .post(
    '/discrepancies',
    async ({ body }) =>
      logParcelDiscrepancyCtrl(
        body as {
          companyId: string;
          actorUserId?: string | null;
          parcelId?: string | null;
          trackingCode?: string | null;
          bookingCode?: string | null;
          discrepancyType: 'record_not_physical' | 'physical_missing_in_system';
          notes?: string | null;
          branchId?: string | null;
        },
      ),
    {
      body: t.Object({
        companyId: UUID,
        actorUserId: t.Optional(t.Union([UUID, t.Null()])),
        parcelId: t.Optional(t.Union([UUID, t.Null()])),
        trackingCode: t.Optional(t.Union([t.String(), t.Null()])),
        bookingCode: t.Optional(t.Union([t.String(), t.Null()])),
        discrepancyType: t.Union([
          t.Literal('record_not_physical'),
          t.Literal('physical_missing_in_system'),
        ]),
        notes: t.Optional(t.Union([t.String({ maxLength: 1000 }), t.Null()])),
        branchId: t.Optional(t.Union([UUID, t.Null()])),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcelIncoming)],
      detail: { tags: ['Shipments'], summary: 'Log parcel discrepancy for incoming transit' },
    },
  )
  .post(
    '/:id/mark-received',
    async ({ params, body }) =>
      markParcelReceivedCtrl(
        params.id,
        body as { receivedBy: string; receivedAt?: string; status?: number },
      ),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        receivedBy: UUID,
        receivedAt: t.Optional(t.String({ format: 'date-time' })),
        status: t.Optional(t.Number()),
      }),
      beforeHandle: [
        requireAuth(),
        requireAnyPermissions(
          PermissionKeys.CanReadParcelIncoming,
          PermissionKeys.CanReadParcelScan,
        ),
      ],
      detail: { tags: ['Shipments'], summary: 'Mark parcel received' },
    },
  )
  .post(
    '/:id/planned-tobepaid',
    async ({ params, body }) =>
      setPlannedToBePaidCtrl(
        params.id,
        (body as { plannedToBePaidCedis: number | string }).plannedToBePaidCedis,
      ),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ plannedToBePaidCedis: t.Union([t.Number(), t.String()]) }),
      detail: { tags: ['Shipments'], summary: 'Set planned to-be-paid (principal)' },
    },
  )
  .post(
    '/:id/soft-delete',
    async ({ params, body, user }) => {
      const authUser = user as AuthUser;
      return softDeleteParcelCtrl({
        parcelId: params.id,
        actorUserId: authUser.sub,
        reason: (body as { reason: string }).reason,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        reason: t.String({ minLength: 3, maxLength: 500 }),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanSoftDeleteParcelsAndPayments),
      ],
      detail: {
        tags: ['Shipments'],
        summary: 'Soft delete parcel and soft-delete (void) associated payments with reason',
      },
    },
  );
