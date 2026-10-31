import { Elysia, t } from 'elysia';
import {
  authPlugin,
  type AuthUser,
  requireAnyPermissions,
  requireAuth,
  requirePermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { MAX_BULK_ARRIVAL_PARCELS } from '@/shared/shipments/bulk-arrival';
import { UUID } from '../../../schemas/common';
import { markParcelReceivedCtrl, markIncomingParcelsArrivedCtrl } from '../parcels.controller';
export const routes = new Elysia({ name: 'parcel-receiving' })
  .use(authPlugin)
  .post(
    '/bulk-mark-received',
    async ({ body, user }) => {
      const authUser = user as AuthUser;
      return markIncomingParcelsArrivedCtrl({
        parcelIds: body.parcelIds,
        companyId: authUser.companyId ?? '',
        branchId: authUser.branchId ?? '',
        actorUserId: authUser.sub,
      });
    },
    {
      body: t.Object({
        parcelIds: t.Array(UUID, {
          minItems: 1,
          maxItems: MAX_BULK_ARRIVAL_PARCELS,
          uniqueItems: true,
        }),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcelIncoming)],
      detail: { tags: ['Shipments'], summary: 'Mark incoming parcels received in bulk' },
    },
  )
  .post(
    '/:id/mark-received',
    async ({ params, body, user }) =>
      markParcelReceivedCtrl(params.id, { ...body, receivedBy: (user as AuthUser).sub }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        receivedBy: t.Optional(UUID),
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
  );
