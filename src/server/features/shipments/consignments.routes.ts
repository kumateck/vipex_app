import { Elysia, t } from 'elysia';
import {
  addItemsToConsignmentCtrl,
  createConsignmentCtrl,
  removeItemFromConsignmentCtrl,
} from './consignments.controller';

export const consignmentsRoutes = new Elysia({ name: 'consignments' })
  .post(
    '/',
    async ({ body, set }) => {
      const res = await createConsignmentCtrl(
        body as {
          companyId: string;
          sourceId: string;
          destinationId: string;
          consignmentDate: string;
          createdBy: string;
        },
      );
      set.status = 201;
      return res;
    },
    {
      body: t.Object({
        companyId: t.String({ format: 'uuid' }),
        sourceId: t.String({ format: 'uuid' }),
        destinationId: t.String({ format: 'uuid' }),
        consignmentDate: t.String({ format: 'date' }),
        createdBy: t.String({ format: 'uuid' }),
      }),
      detail: { tags: ['Shipments'], summary: 'Create consignment with daily serial' },
    },
  )
  .post(
    '/:id/items',
    async ({ params, body }) =>
      addItemsToConsignmentCtrl({
        consignmentId: params.id,
        parcelIds: (body as { parcelIds: string[] }).parcelIds,
      }),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({ parcelIds: t.Array(t.String({ format: 'uuid' }), { minItems: 1 }) }),
      detail: { tags: ['Shipments'], summary: 'Add parcels to consignment' },
    },
  )
  .post(
    '/:id/items/remove',
    async ({ params, body }) =>
      removeItemFromConsignmentCtrl({
        consignmentId: params.id,
        parcelId: (body as { parcelId: string }).parcelId,
      }),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({ parcelId: t.String({ format: 'uuid' }) }),
      detail: { tags: ['Shipments'], summary: 'Remove parcel from consignment (mark removedAt)' },
    },
  );
