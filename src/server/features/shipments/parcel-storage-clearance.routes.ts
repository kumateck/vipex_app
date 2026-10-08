import { Elysia, t } from 'elysia';
import {
  authPlugin,
  type AuthUser,
  requireAnyPermissions,
  requireAuth,
  requirePermissions,
} from '@/server/plugins/auth';
import { ParcelStorageClearanceStatus } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import { Forbidden } from '@/server/utils/http-error';
import { clearanceScope } from './parcel-storage-clearance-scope';
import { parcelStorageClearanceLookupRoutes } from './parcel-storage-clearance-lookup.routes';
import { UUID } from '../../schemas/common';
import { getParcelStorageClearanceRepo } from './parcel-storage-clearance.repository';
import { getParcelStorageClearanceDetailSvc } from './parcel-storage-clearance-detail.service';
import {
  listParcelStorageClearancesCtrl,
  approveParcelStorageClearanceCtrl,
  createParcelStorageClearanceCtrl,
  executeParcelStorageClearanceCtrl,
  rejectParcelStorageClearanceCtrl,
  resubmitParcelStorageClearanceCtrl,
  returnParcelStorageClearanceForReviewCtrl,
} from './parcels.controller';

function parseStatuses(value?: string | number[]) {
  if (!value) return null;
  return (Array.isArray(value) ? value : value.split(',')).map(Number).filter(Number.isFinite);
}
export const parcelStorageClearanceRoutes = new Elysia({ name: 'parcel-storage-clearances' })
  .use(authPlugin)
  .use(parcelStorageClearanceLookupRoutes)
  .get(
    '/storage-clearances/:id',
    ({ params, user }) =>
      getParcelStorageClearanceDetailSvc({
        id: params.id,
        ...clearanceScope(user as AuthUser),
      }),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requireAnyPermissions(
          PermissionKeys.CanReadParcelStorageClearances,
          PermissionKeys.CanRequestParcelStorageClearance,
          PermissionKeys.CanApproveParcelStorageClearance,
          PermissionKeys.CanExecuteParcelStorageClearance,
        ),
      ],
      detail: {
        tags: ['Shipments'],
        summary: 'Read storage clearance current accrual and history',
      },
    },
  )
  .get(
    '/storage-clearances',
    async ({ query, user }) => {
      const authUser = user as AuthUser;
      return listParcelStorageClearancesCtrl({
        ...clearanceScope(authUser),
        statuses: parseStatuses(query.statuses),
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
        search: query.search ?? null,
      });
    },
    {
      query: t.Object({
        companyId: t.Optional(UUID),
        branchId: t.Optional(t.Union([UUID, t.Null()])),
        statuses: t.Optional(t.Union([t.Array(t.Number()), t.String()])),
        page: t.Optional(t.Number({ minimum: 1 })),
        pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        search: t.Optional(t.String()),
      }),
      beforeHandle: [
        requireAuth(),
        requireAnyPermissions(
          PermissionKeys.CanReadParcelStorageClearances,
          PermissionKeys.CanRequestParcelStorageClearance,
          PermissionKeys.CanApproveParcelStorageClearance,
          PermissionKeys.CanExecuteParcelStorageClearance,
        ),
      ],
      detail: { tags: ['Shipments'], summary: 'List storage fee clearance requests' },
    },
  )
  .post(
    '/storage-clearances',
    async ({ body, user }) => {
      const authUser = user as AuthUser;
      return createParcelStorageClearanceCtrl({
        ...clearanceScope(authUser),
        parcelId: (body as { parcelId: string }).parcelId,
        actorUserId: authUser.sub,
        requestedDays: (body as { requestedDays?: number | null }).requestedDays ?? null,
        clearAll: (body as { clearAll?: boolean }).clearAll ?? false,
        reason: (body as { reason: string }).reason,
        evidenceUrl: (body as { evidenceUrl?: string | null }).evidenceUrl ?? null,
      });
    },
    {
      body: t.Object({
        parcelId: UUID,
        requestedDays: t.Optional(t.Union([t.Number(), t.Null()])),
        clearAll: t.Optional(t.Boolean()),
        reason: t.String({ minLength: 3, maxLength: 1000 }),
        evidenceUrl: t.Optional(t.Union([t.String({ maxLength: 2000 }), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanRequestParcelStorageClearance),
      ],
      detail: { tags: ['Shipments'], summary: 'Create storage fee clearance request' },
    },
  )
  .post(
    '/storage-clearances/:id/resubmit',
    async ({ params, body, user }) => {
      const authUser = user as AuthUser;
      return resubmitParcelStorageClearanceCtrl({
        ...clearanceScope(authUser),
        requestId: params.id,
        actorUserId: authUser.sub,
        requestedDays: (body as { requestedDays?: number | null }).requestedDays ?? null,
        clearAll: (body as { clearAll?: boolean }).clearAll ?? false,
        reason: (body as { reason: string }).reason,
        evidenceUrl: (body as { evidenceUrl?: string | null }).evidenceUrl ?? null,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        requestedDays: t.Optional(t.Union([t.Number(), t.Null()])),
        clearAll: t.Optional(t.Boolean()),
        reason: t.String({ minLength: 3, maxLength: 1000 }),
        evidenceUrl: t.Optional(t.Union([t.String({ maxLength: 2000 }), t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanRequestParcelStorageClearance),
      ],
      detail: { tags: ['Shipments'], summary: 'Resubmit storage fee clearance request' },
    },
  )
  .post(
    '/storage-clearances/:id/approve',
    async ({ params, body, user }) => {
      const authUser = user as AuthUser;
      return approveParcelStorageClearanceCtrl({
        ...clearanceScope(authUser),
        requestId: params.id,
        actorUserId: authUser.sub,
        note: (body as { note?: string | null }).note ?? null,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ note: t.Optional(t.Union([t.String({ maxLength: 1000 }), t.Null()])) }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanApproveParcelStorageClearance),
      ],
      detail: { tags: ['Shipments'], summary: 'Approve storage fee clearance request' },
    },
  )
  .post(
    '/storage-clearances/:id/reject',
    async ({ params, body, user }) => {
      const authUser = user as AuthUser;
      const request = await getParcelStorageClearanceRepo(params.id);
      const permission =
        request?.status === ParcelStorageClearanceStatus.APPROVED_FOR_FINANCE
          ? PermissionKeys.CanExecuteParcelStorageClearance
          : PermissionKeys.CanApproveParcelStorageClearance;
      if (!authUser.permissions?.includes(permission)) throw Forbidden();
      return rejectParcelStorageClearanceCtrl({
        ...clearanceScope(authUser),
        requestId: params.id,
        actorUserId: authUser.sub,
        expectedStatus: request?.status,
        note: (body as { note: string }).note,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ note: t.String({ minLength: 3, maxLength: 1000 }) }),
      beforeHandle: [
        requireAuth(),
        requireAnyPermissions(
          PermissionKeys.CanApproveParcelStorageClearance,
          PermissionKeys.CanExecuteParcelStorageClearance,
        ),
      ],
      detail: { tags: ['Shipments'], summary: 'Reject storage fee clearance request' },
    },
  )
  .post(
    '/storage-clearances/:id/return-for-review',
    async ({ params, body, user }) => {
      const authUser = user as AuthUser;
      return returnParcelStorageClearanceForReviewCtrl({
        ...clearanceScope(authUser),
        requestId: params.id,
        actorUserId: authUser.sub,
        note: (body as { note: string }).note,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ note: t.String({ minLength: 3, maxLength: 1000 }) }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanExecuteParcelStorageClearance),
      ],
      detail: { tags: ['Shipments'], summary: 'Return storage clearance for review' },
    },
  )
  .post(
    '/storage-clearances/:id/execute',
    async ({ params, body, user }) => {
      const authUser = user as AuthUser;
      return executeParcelStorageClearanceCtrl({
        ...clearanceScope(authUser),
        requestId: params.id,
        actorUserId: authUser.sub,
        note: (body as { note?: string | null }).note ?? null,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ note: t.Optional(t.Union([t.String({ maxLength: 1000 }), t.Null()])) }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanExecuteParcelStorageClearance),
      ],
      detail: { tags: ['Shipments'], summary: 'Execute storage fee clearance request' },
    },
  );
