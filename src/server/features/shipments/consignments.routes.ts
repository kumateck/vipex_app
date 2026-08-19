import { Elysia, t } from 'elysia';
import { HttpStatus } from '../../utils/http-status';
import { UUID } from '../../schemas/common';
import { authPlugin, requireAuth, requirePermissions, type AuthUser } from '../../plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  addItemsToConsignmentCtrl,
  closeConsignmentCtrl,
  createConsignmentCtrl,
  getConsignmentDetailCtrl,
  listConsignmentItemsCtrl,
  listIncomingConsignmentsCtrl,
  receiveConsignmentItemCtrl,
  removeItemFromConsignmentCtrl,
} from './consignments.controller';

export const consignmentsRoutes = new Elysia({ name: 'consignments' })
  .use(authPlugin)
  .get(
    '/incoming',
    async ({ query, user }) => {
      const authUser = user as AuthUser;
      return listIncomingConsignmentsCtrl({
        companyId: query.companyId ?? authUser.companyId ?? '',
        destinationId: query.destinationId ?? authUser.branchId ?? '',
        statuses: query.statuses,
      });
    },
    {
      query: t.Object({
        companyId: t.Optional(UUID),
        destinationId: t.Optional(UUID),
        statuses: t.Optional(t.Array(t.Number())),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcelIncoming)],
      detail: {
        tags: ['Shipments'],
        summary: 'List consignments incoming to a branch (Branch Receiving Manifest)',
      },
    },
  )
  .get('/:id', async ({ params }) => getConsignmentDetailCtrl(params.id), {
    params: t.Object({ id: UUID }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadConsignments)],
    detail: { tags: ['Shipments'], summary: 'Get consignment header with receiving counts' },
  })
  .get('/:id/items', async ({ params }) => listConsignmentItemsCtrl(params.id), {
    params: t.Object({ id: UUID }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadConsignments)],
    detail: {
      tags: ['Shipments'],
      summary: 'List active items of a consignment with arrival status',
    },
  })
  .post(
    '/:id/receive',
    async ({ params, body, user }) => {
      const authUser = user as AuthUser;
      return receiveConsignmentItemCtrl({
        consignmentId: params.id,
        code: (body as { code: string }).code,
        actorUserId: authUser.sub,
        actorBranchId: authUser.branchId,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ code: t.String({ minLength: 1 }) }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcelScan)],
      detail: {
        tags: ['Shipments'],
        summary: 'Scan/enter a parcel code to receive it against this consignment',
      },
    },
  )
  .post(
    '/:id/close',
    async ({ params, body, user }) => {
      const authUser = user as AuthUser;
      const b = body as { forceWithExceptions?: boolean; exceptionReason?: string };
      return closeConsignmentCtrl({
        consignmentId: params.id,
        actorUserId: authUser.sub,
        actorBranchId: authUser.branchId,
        forceWithExceptions: b.forceWithExceptions,
        exceptionReason: b.exceptionReason,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        forceWithExceptions: t.Optional(t.Boolean()),
        exceptionReason: t.Optional(t.String({ maxLength: 1000 })),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateConsignments)],
      detail: {
        tags: ['Shipments'],
        summary:
          'Close a consignment; blocks with a 400 if parcels are missing unless forceWithExceptions + exceptionReason are provided',
      },
    },
  )
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
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateConsignments)],
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
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanCreateConsignments)],
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
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateConsignments)],
      detail: { tags: ['Shipments'], summary: 'Remove parcel from consignment (mark removedAt)' },
    },
  );
