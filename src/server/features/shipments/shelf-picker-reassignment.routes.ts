import { Elysia, t } from 'elysia';
import { authPlugin, type AuthUser, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { ParcelStatus } from '@/db/schemas/enums';
import { Forbidden } from '@/server/utils/http-error';
import { listParcelsCtrl } from './parcels.controller';

export const shelfPickerReassignmentRoutes = new Elysia({ name: 'shelf-picker-reassignment' })
  .use(authPlugin)
  .get(
    '/shelf-picker-reassignments',
    ({ query, user }) => {
      const actor = user as AuthUser;
      if (!actor.companyId || !actor.branchId)
        throw Forbidden('Company and branch context are required');
      return listParcelsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        filters: {
          companyId: actor.companyId,
          destinationId: actor.branchId,
          status: ParcelStatus.AWAITING_PICKUP,
          shelfPickerAssigned: true,
        },
      });
    },
    {
      query: t.Object({
        page: t.Optional(t.Number({ minimum: 1 })),
        pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        search: t.Optional(t.String({ maxLength: 255 })),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateParcelShelfPicker)],
      detail: {
        tags: ['Shipments'],
        summary: 'List assigned parcels awaiting shelf pickup reassignment',
      },
    },
  );
