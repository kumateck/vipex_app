import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { PaginationRequestQuery, UUID } from '../../schemas/common';
import {
  createParcelCtrl,
  getParcelByIdCtrl,
  listParcelsCtrl,
  markParcelReceivedCtrl,
  setPlannedToBePaidCtrl,
  updateParcelCtrl,
} from './parcels.controller';

export const parcelsRoutes = new Elysia({ name: 'parcels' })
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
            status: query.status ?? null,
            received: query.received ?? null,
            includeDeleted: query.includeDeleted ?? null,
          },
      }),
    {
      query: t.Intersect([
        PaginationRequestQuery,
        t.Object({
          companyId: t.Optional(UUID),
          sourceId: t.Optional(UUID),
          destinationId: t.Optional(UUID),
          status: t.Optional(t.Number()),
          search: t.Optional(t.String()),
          received: t.Optional(t.Boolean()),
          includeDeleted: t.Optional(t.Boolean()),
        }),
      ]),
      detail: { tags: ['Shipments'], summary: 'List/search parcels' },
    },
  )
  .get('/:id', async ({ params }) => getParcelByIdCtrl(params.id), {
    params: t.Object({ id: UUID }),
    detail: { tags: ['Shipments'], summary: 'Get parcel' },
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
  );
