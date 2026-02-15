import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { UUID } from '../../schemas/common';
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
      set.status = HttpStatus.CREATED;
      return res;
    },
    {
      body: t.Object({
        companyId: UUID,
        sourceId: UUID,
        destinationId: UUID,
        consignmentDate: t.String({ format: 'date' }),
        createdBy: UUID,
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
      params: t.Object({ id: UUID }),
      body: t.Object({ parcelIds: t.Array(UUID, { minItems: 1 }) }),
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
      params: t.Object({ id: UUID }),
      body: t.Object({ parcelId: UUID }),
      detail: { tags: ['Shipments'], summary: 'Remove parcel from consignment (mark removedAt)' },
    },
  );
