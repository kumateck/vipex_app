import { Elysia, t } from 'elysia';
import { authPlugin, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { UUID } from '@/server/schemas/common';
import { PermissionKeys } from '@/shared/permissions/constants';
import { HttpStatus } from '@/server/utils/http-status';
import {
  acknowledgeParcelInternalTransferCtrl,
  cancelParcelInternalTransferCtrl,
  createParcelInternalTransferCtrl,
  getParcelInternalTransferDetailsCtrl,
  listParcelInternalTransfersCtrl,
} from './controller';

export const parcelInternalTransfersRoutes = new Elysia({ name: 'parcel-internal-transfers' })
  .use(authPlugin)
  .get(
    '/',
    async ({ query, user }) =>
      listParcelInternalTransfersCtrl({
        companyId: user!.companyId ?? query.companyId ?? '',
        branchId: query.branchId ?? null,
        status: query.status ?? null,
        destinationLocationId: query.destinationLocationId ?? null,
        destinationWarehouseId: query.destinationWarehouseId ?? null,
        sourceLocationId: query.sourceLocationId ?? null,
        sourceWarehouseId: query.sourceWarehouseId ?? null,
      }),
    {
      query: t.Object({
        companyId: t.Optional(UUID),
        branchId: t.Optional(UUID),
        status: t.Optional(t.Number()),
        destinationLocationId: t.Optional(UUID),
        destinationWarehouseId: t.Optional(UUID),
        sourceLocationId: t.Optional(UUID),
        sourceWarehouseId: t.Optional(UUID),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadParcelInternalTransfers),
      ],
    },
  )
  .get(
    '/:id',
    async ({ params, user }) =>
      getParcelInternalTransferDetailsCtrl(params.id, user!.companyId ?? ''),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadParcelInternalTransfers),
      ],
    },
  )
  .post(
    '/',
    async ({ body, set, user }) => {
      const result = await createParcelInternalTransferCtrl({
        ...body,
        companyId: user!.companyId!,
        transferredBy: user!.sub,
      });
      set.status = HttpStatus.CREATED;
      return result;
    },
    {
      body: t.Object({
        branchId: UUID,
        sourceHolderType: t.Number(),
        sourceLocationId: t.Optional(t.Union([UUID, t.Null()])),
        sourceWarehouseId: t.Optional(t.Union([UUID, t.Null()])),
        destinationHolderType: t.Number(),
        destinationLocationId: t.Optional(t.Union([UUID, t.Null()])),
        destinationWarehouseId: t.Optional(t.Union([UUID, t.Null()])),
        notes: t.Optional(t.Union([t.String({ maxLength: 1000 }), t.Null()])),
        parcelIds: t.Array(UUID, { minItems: 1 }),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCreateParcelInternalTransfers),
      ],
    },
  )
  .post(
    '/:id/acknowledge',
    async ({ params, user }) =>
      acknowledgeParcelInternalTransferCtrl({
        id: params.id,
        companyId: user!.companyId!,
        acknowledgedBy: user!.sub,
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanAcknowledgeParcelInternalTransfers),
      ],
    },
  )
  .post(
    '/:id/cancel',
    async ({ params, body, user }) =>
      cancelParcelInternalTransferCtrl({
        id: params.id,
        companyId: user!.companyId!,
        cancelledBy: user!.sub,
        cancelReason: body.cancelReason,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ cancelReason: t.String({ minLength: 1, maxLength: 1000 }) }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanCancelParcelInternalTransfers),
      ],
    },
  );
