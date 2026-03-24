import { Elysia, t } from 'elysia';
import { UUID } from '../../schemas/common';
import { autoGroupingController, getGroupingStatusController } from './auto-grouping.controller';
import type { AutoGroupingInput } from './auto-grouping.service';

export const autoGroupingRoutes = new Elysia({ name: 'auto-grouping' })
  // Auto-group parcels
  .post('/auto-group', async ({ body }) => autoGroupingController(body as AutoGroupingInput), {
    body: t.Object({
      sourceBranchId: UUID,
      companyId: t.Optional(UUID),
      minParcelCount: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
      maxWaitMinutes: t.Optional(t.Number({ minimum: 30, maximum: 720 })),
      forceCreate: t.Optional(t.Boolean()),
    }),
    detail: {
      tags: ['Consignments'],
      summary: 'Auto-group parcels into consignments',
      operationId: 'autoGroupParcels',
    },
  })

  // Get grouping status
  .get('/status/:branchId', async ({ params }) => getGroupingStatusController(params.branchId), {
    params: t.Object({ branchId: UUID }),
    detail: {
      tags: ['Consignments'],
      summary: 'Get parcel grouping status',
      operationId: 'getGroupingStatus',
    },
  });
