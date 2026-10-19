import { Elysia, t } from 'elysia';
import { authPlugin, type AuthUser, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { UUID } from '../../schemas/common';
import { listParcelsCtrl } from './parcels.controller';
import {
  assertStorageClearanceScope,
  getCurrentStorageAccrual,
} from './parcel-storage-clearance.helpers';
import { clearanceScope } from './parcel-storage-clearance-scope';

const beforeHandle = [
  requireAuth(),
  requirePermissions(PermissionKeys.CanRequestParcelStorageClearance),
];

export const parcelStorageClearanceLookupRoutes = new Elysia({ name: 'storage-clearance-lookups' })
  .use(authPlugin)
  .get(
    '/storage-clearances/parcel-search',
    ({ query, user }) => {
      const scope = clearanceScope(user as AuthUser);
      return listParcelsCtrl({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        filters: { companyId: scope.companyId, scopedBranchId: scope.branchId },
      });
    },
    {
      query: t.Object({
        search: t.String({ minLength: 2, maxLength: 255 }),
        page: t.Optional(t.Number({ minimum: 1 })),
        pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
      }),
      beforeHandle,
      detail: { tags: ['Shipments'], summary: 'Search scoped parcels for storage clearance' },
    },
  )
  .get(
    '/storage-clearances/parcels/:id',
    async ({ params, user }) => {
      const current = await getCurrentStorageAccrual(params.id);
      assertStorageClearanceScope(current.parcel, clearanceScope(user as AuthUser));
      return {
        parcelId: current.parcel.id,
        accruedDays: current.clearableDays,
        totalAccruedDays: current.snapshot.storageChargeDays,
        dailyRatePsw: current.policy.storageFeePerDayPsw,
        outstandingPsw: current.settlement.outstandingPsw,
      };
    },
    {
      params: t.Object({ id: UUID }),
      beforeHandle,
      detail: {
        tags: ['Shipments'],
        summary: 'Read current unpaid storage accrual for a scoped parcel',
      },
    },
  );
