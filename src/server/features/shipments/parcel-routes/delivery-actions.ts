import { Elysia, t } from 'elysia';
import { authPlugin, type AuthUser, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { UUID } from '../../../schemas/common';
import { listParcelsCtrl } from '../parcels.controller';
import { ParcelStatus } from '@/db/schemas/enums';
import { reverseParcelDeliverySvc } from '../parcel-delivery-reversal.service';
import { returnParcelToSourceSvc } from '../return-to-source.service';
import { emptyParcelList } from './helpers';
export const routes = new Elysia({ name: 'parcel-delivery-actions' })
  .use(authPlugin)
  .get(
    '/delivery-reversal-candidates',
    async ({ query, user }) => {
      const authUser = user as AuthUser;
      if (!authUser.companyId || !authUser.branchId) return emptyParcelList(query);
      return listParcelsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        filters: {
          companyId: authUser.companyId,
          destinationId: authUser.branchId,
          statuses: [ParcelStatus.DELIVERED_BY_OFFICE, ParcelStatus.DELIVERED_AT_HOME],
        },
      });
    },
    {
      query: t.Object({
        page: t.Optional(t.Number({ minimum: 1 })),
        pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        search: t.Optional(t.String()),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReverseParcelDelivery)],
      detail: { tags: ['Shipments'], summary: 'List delivered parcels at the current branch' },
    },
  )
  .post(
    '/:id/reverse-delivery',
    async ({ params, body, user }) => {
      const authUser = user as AuthUser;
      return reverseParcelDeliverySvc({
        parcelId: params.id,
        companyId: authUser.companyId ?? '',
        branchId: authUser.branchId ?? '',
        actorUserId: authUser.sub,
        reason: body.reason,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ reason: t.String({ minLength: 5, maxLength: 500 }) }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReverseParcelDelivery)],
      detail: { tags: ['Shipments'], summary: 'Reverse a parcel delivery confirmation' },
    },
  )
  .post(
    '/:id/return-to-source',
    async ({ params, body, user }) => {
      const authUser = user as AuthUser;
      return returnParcelToSourceSvc({
        parcelId: params.id,
        companyId: authUser.companyId ?? '',
        branchId: authUser.branchId ?? '',
        actorUserId: authUser.sub,
        reason: body.reason,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ reason: t.String({ minLength: 5, maxLength: 500 }) }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateParcels)],
      detail: { tags: ['Shipments'], summary: 'Record return to source branch' },
    },
  );
