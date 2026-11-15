import { Elysia, t } from 'elysia';
import { authPlugin, requireAuth, requirePermissions, type AuthUser } from '@/server/plugins/auth';
import { UUID } from '@/server/schemas/common';
import { Forbidden } from '@/server/utils/http-error';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  BATCH_PAYMENT_METHODS,
  MAX_BATCH_PARCELS,
  type BatchHandoverWorkflow,
} from '@/shared/shipments/parcel-batch-handover';
import { MAX_HANDOVER_SIGNATURE_LENGTH } from '@/shared/shipments/handover-signature';
import { readNativeClient } from '../auth/device-headers';
import { confirmBatchHandover } from './confirm';
import { requestBatchOtp, verifyBatchOtp } from './otp';
import { searchBatchParcels } from './search';
import type { BatchActor } from './selection';

const telephone = t.String({ minLength: 10, maxLength: 40, pattern: '^[+0-9 ().-]+$' });
const selection = {
  telephone,
  items: t.Array(
    t.Object({
      id: UUID,
      receiverId: UUID,
      principalPsw: t.Integer({ minimum: 0 }),
      storagePsw: t.Integer({ minimum: 0 }),
    }),
    { minItems: 2, maxItems: MAX_BATCH_PARCELS },
  ),
};
const signatureImage = t.String({ minLength: 1, maxLength: MAX_HANDOVER_SIGNATURE_LENGTH });
const signature = t.Union([
  t.Object({ source: t.Literal('touchscreen'), signatureImage }),
  t.Object({ source: t.Literal('topaz'), signatureImage, sigString: signatureImage }),
]);

function batchRoutes(workflow: BatchHandoverWorkflow) {
  const prefix = `/${workflow}-batch-handover` as const;
  const permission =
    workflow === 'office-pickup'
      ? PermissionKeys.CanCompleteOfficePickup
      : PermissionKeys.CanCreateReceiverPayments;
  const gate = [requireAuth(), requirePermissions(permission)];
  function scope(actor: AuthUser): BatchActor {
    if (!actor.companyId || !actor.branchId) throw Forbidden('A company and branch are required');
    return {
      companyId: actor.companyId,
      branchId: actor.branchId,
      actorId: actor.sub,
      locationId: actor.locationId,
      workflow,
    };
  }

  return new Elysia({ name: `${workflow}-batch-handover`, prefix })
    .use(authPlugin)
    .get(
      '/',
      ({ user, query, set }) => {
        set.headers['cache-control'] = 'no-store';
        return searchBatchParcels(scope(user as AuthUser), query);
      },
      { query: t.Object({ telephone, after: t.Optional(UUID) }), beforeHandle: gate },
    )
    .post('/otp/request', ({ user, body }) => requestBatchOtp(scope(user as AuthUser), body), {
      body: t.Object({ ...selection, channel: t.Union([t.Literal('sms'), t.Literal('whatsapp')]) }),
      beforeHandle: gate,
    })
    .post(
      '/otp/verify',
      ({ user, body, set }) => {
        set.headers['cache-control'] = 'no-store';
        return verifyBatchOtp(scope(user as AuthUser), body);
      },
      {
        body: t.Object({ id: UUID, otp: t.String({ pattern: '^[0-9]{6}$' }) }),
        beforeHandle: gate,
      },
    )
    .post(
      '/confirm',
      ({ user, body, request }) => {
        if (body.signature.source === 'topaz' && readNativeClient(request) !== 'desktop')
          throw Forbidden('Use Vipex Desktop to capture a Topaz signature');
        return confirmBatchHandover(scope(user as AuthUser), body);
      },
      {
        body: t.Object({
          ...selection,
          id: UUID,
          verificationToken: t.String({ pattern: '^[a-f0-9]{48}$' }),
          associateId: t.Optional(UUID),
          paymentMethod: t.Optional(
            t.Union(BATCH_PAYMENT_METHODS.map(({ value }) => t.Literal(value))),
          ),
          signature,
        }),
        beforeHandle: gate,
      },
    );
}

export const parcelBatchHandoverRoutes = new Elysia({ name: 'parcel-batch-handover' })
  .use(batchRoutes('office-pickup'))
  .use(batchRoutes('receiver-cashier'));
