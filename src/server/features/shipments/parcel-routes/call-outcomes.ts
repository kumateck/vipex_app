import { Elysia, t } from 'elysia';
import { authPlugin, type AuthUser, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { UUID } from '../../../schemas/common';
import { resolveParcelDiscrepancyCtrl } from '../parcels.controller';
import { saveBulkCallOutcomeSvc } from '../parcel-bulk-call-outcome.service';
import { recordCallCenterContactSvc } from '../parcel-call-center-contact.service';
import { changeMainReceiverWithCallOutcomeSvc } from '../parcel-main-receiver-change.service';
import { findCustomerNameByExactTelephoneRepo } from '../../customers/repository';
export const routes = new Elysia({ name: 'parcel-call-outcomes' })
  .use(authPlugin)
  .post(
    '/discrepancies/:id/resolve',
    async ({ params, body, user }) => {
      const authUser = user as AuthUser;
      return resolveParcelDiscrepancyCtrl({
        id: params.id,
        companyId: authUser.companyId ?? '',
        actorUserId: authUser.sub,
        resolutionNote: (body as { resolutionNote?: string | null }).resolutionNote ?? null,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        resolutionNote: t.Optional(t.Union([t.String({ maxLength: 1000 }), t.Null()])),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadParcelIncoming)],
      detail: { tags: ['Shipments'], summary: 'Resolve parcel discrepancy' },
    },
  )
  .post(
    '/bulk-call-outcome',
    async ({ body, user }) => {
      const authUser = user as AuthUser;
      return saveBulkCallOutcomeSvc({
        parcelIds: body.parcelIds,
        outcome: body.outcome,
        companyId: authUser.companyId ?? '',
        branchId: authUser.branchId ?? '',
        locationId: authUser.locationId,
        actorUserId: authUser.sub,
      });
    },
    {
      body: t.Object({
        parcelIds: t.Array(UUID, { minItems: 1, maxItems: 100, uniqueItems: true }),
        outcome: t.Union([t.Literal('follow_up'), t.Literal('pickup'), t.Literal('delivery')]),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadCallCenterParcelStatus),
      ],
      detail: { tags: ['Shipments'], summary: 'Save selected parcel call outcomes' },
    },
  )
  .post(
    '/:id/call-center/contact',
    async ({ params, body, user }) => {
      const authUser = user as AuthUser;
      return recordCallCenterContactSvc({
        parcelId: params.id,
        companyId: authUser.companyId ?? '',
        branchId: authUser.branchId ?? '',
        locationId: authUser.locationId,
        actorUserId: authUser.sub,
        outcome: body.outcome,
        secondReceiverId: body.secondReceiverId,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        outcome: t.Optional(
          t.Union([t.Literal('follow_up'), t.Literal('pickup'), t.Literal('delivery')]),
        ),
        secondReceiverId: t.Optional(t.Union([UUID, t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadCallCenterParcelStatus),
      ],
      detail: {
        tags: ['Shipments'],
        summary: 'Record a call or change an assigned parcel outcome',
      },
    },
  )
  .get(
    '/call-center/receiver-lookup/:telephone',
    async ({ params, user }) => {
      const authUser = user as AuthUser;
      const telephone = params.telephone.replace(/\D/g, '');
      if (!/^\d{10}$/.test(telephone)) return null;
      if (!authUser.companyId) return null;
      return findCustomerNameByExactTelephoneRepo({ companyId: authUser.companyId, telephone });
    },
    {
      params: t.Object({ telephone: t.String({ minLength: 10, maxLength: 20 }) }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadCallCenterParcelStatus),
      ],
      detail: {
        tags: ['Shipments'],
        summary: 'Find a main receiver by exact telephone for call outcome',
      },
    },
  )
  .post(
    '/:id/call-outcome/change-main-receiver',
    async ({ params, body, user }) => {
      const authUser = user as AuthUser;
      return changeMainReceiverWithCallOutcomeSvc({
        parcelId: params.id,
        companyId: authUser.companyId ?? '',
        branchId: authUser.branchId ?? '',
        locationId: authUser.locationId,
        actorUserId: authUser.sub,
        telephone: body.telephone,
        fullname: body.fullname,
        outcome: body.outcome,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        telephone: t.String({ minLength: 10, maxLength: 20 }),
        fullname: t.Optional(t.String({ maxLength: 255 })),
        outcome: t.Union([t.Literal('follow_up'), t.Literal('pickup'), t.Literal('delivery')]),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadCallCenterParcelStatus),
      ],
      detail: { tags: ['Shipments'], summary: 'Change main receiver and save parcel call outcome' },
    },
  );
