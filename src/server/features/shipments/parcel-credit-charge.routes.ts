import { Elysia, t } from 'elysia';
import {
  authPlugin,
  requireAnyPermissions,
  requireAuth,
  requirePermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { UUID } from '@/server/schemas/common';
import {
  requestCreditChargeSvc,
  decideCreditChargeSvc,
  listCreditChargeRequestsSvc,
} from './parcel-charge-corrections';

export const parcelCreditChargeRoutes = new Elysia({ name: 'parcel-credit-charge' })
  .use(authPlugin)
  .get(
    '/charge-corrections',
    ({ query, user }) =>
      listCreditChargeRequestsSvc({
        ...query,
        companyId: user!.companyId!,
        actorUserId: user!.sub,
      }),
    {
      query: t.Object({
        page: t.Optional(t.Integer({ minimum: 1, maximum: 1000000 })),
        search: t.Optional(t.String({ maxLength: 80 })),
        parcelId: t.Optional(UUID),
      }),
      beforeHandle: [
        requireAuth(),
        requireAnyPermissions(
          PermissionKeys.CanUpdateParcelCharge,
          PermissionKeys.CanApproveParcelCharge,
        ),
      ],
      detail: {
        tags: ['Parcels'],
        summary: 'List zero-charge correction requests in the current company',
      },
    },
  )
  .patch(
    '/:id/credit-charge',
    ({ params, body, user, set }) => {
      set.status = 202;
      return requestCreditChargeSvc({
        ...body,
        parcelId: params.id,
        companyId: user!.companyId!,
        actorUserId: user!.sub,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        chargeCedis: t.Union([t.Number(), t.String()]),
        expectedChargePsw: t.Literal(0),
        method: t.Literal(4),
        reason: t.String({ minLength: 3, maxLength: 500 }),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateParcelCharge)],
      detail: {
        tags: ['Parcels'],
        summary: 'Request correction of a zero charge to CREDIT; approval required',
      },
    },
  )
  .post(
    '/charge-corrections/:id/review',
    ({ params, body, user }) =>
      decideCreditChargeSvc({
        companyId: user!.companyId!,
        requestId: params.id,
        actorUserId: user!.sub,
        approve: body.approve,
        note: body.note,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({ approve: t.Boolean(), note: t.Optional(t.String({ maxLength: 500 })) }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanApproveParcelCharge)],
      detail: {
        tags: ['Parcels'],
        summary: 'Independently approve and apply, or reject, a zero-charge correction',
      },
    },
  );
