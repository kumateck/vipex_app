import { Elysia, t } from 'elysia';
import { authPlugin, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { UUID } from '@/server/schemas/common';
import { updateCreditParcelChargeSvc } from '../customers/credit-settlement';

export const parcelCreditChargeRoutes = new Elysia({ name: 'parcel-credit-charge' })
  .use(authPlugin)
  .patch(
    '/:id/credit-charge',
    ({ params, body, user }) =>
      updateCreditParcelChargeSvc({
        ...body,
        parcelId: params.id,
        companyId: user!.companyId!,
        actorUserId: user!.sub,
      }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        chargeCedis: t.Union([t.Number(), t.String()]),
        expectedChargePsw: t.Integer({ minimum: 1 }),
        reason: t.String({ minLength: 3, maxLength: 500 }),
      }),
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanUpdateParcels)],
      detail: {
        tags: ['Parcels'],
        summary: 'Update an unpaid credit parcel charge with a ledger adjustment',
      },
    },
  );
