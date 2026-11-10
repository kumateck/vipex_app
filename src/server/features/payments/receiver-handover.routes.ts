import { Elysia, t } from 'elysia';
import { authPlugin, requireAuth, requirePermissions, type AuthUser } from '@/server/plugins/auth';
import { UUID } from '@/server/schemas/common';
import { Forbidden } from '@/server/utils/http-error';
import { PermissionKeys } from '@/shared/permissions/constants';
import { MAX_HANDOVER_SIGNATURE_LENGTH } from '@/shared/shipments/handover-signature';
import { readNativeClient } from '../auth/device-headers';
import { waitForReceiverHandoverChange } from './services/receiver-handover-changes';
import {
  captureReceiverHandoverSignature,
  confirmSignedReceiverHandover,
  getReceiverHandoverPreview,
  listReceiverHandovers,
} from './services/receiver-handover.service';

const gate = [requireAuth(), requirePermissions(PermissionKeys.CanCreateReceiverPayments)];
const params = t.Object({ parcelId: UUID });
const signatureImage = t.String({ minLength: 1, maxLength: MAX_HANDOVER_SIGNATURE_LENGTH });
const signature = t.Union([
  t.Object({ source: t.Literal('touchscreen'), signatureImage }),
  t.Object({ source: t.Literal('topaz'), signatureImage, sigString: signatureImage }),
]);

function scope(user: AuthUser) {
  if (!user.companyId || !user.branchId) throw Forbidden('A company and branch are required');
  return { companyId: user.companyId, branchId: user.branchId, actorId: user.sub };
}

export const receiverHandoverRoutes = new Elysia({ name: 'receiver-handovers' })
  .use(authPlugin)
  .get(
    '/receiver-handovers',
    async ({ user, query, request, set }) => {
      const branch = scope(user as AuthUser);
      const { revision } = await waitForReceiverHandoverChange(branch, query.since, request.signal);
      const page = await listReceiverHandovers({ ...branch, ...query });
      set.headers['cache-control'] = 'no-store';
      return { ...page, revision };
    },
    {
      beforeHandle: gate,
      query: t.Object({
        after: t.Optional(t.String({ maxLength: 55, pattern: '^[0-9TZ:.-]+~[A-Za-z0-9_-]+$' })),
        parcelId: t.Optional(UUID),
        handoverId: t.Optional(UUID),
        search: t.Optional(t.String({ maxLength: 100 })),
        since: t.Optional(t.String({ maxLength: 80 })),
      }),
    },
  )
  .get(
    '/receiver-handovers/:parcelId/signature',
    ({ params, query, user, request, set }) => {
      if (readNativeClient(request) !== 'desktop')
        throw Forbidden('Review signatures in Vipex Desktop');
      set.headers['cache-control'] = 'no-store';
      return getReceiverHandoverPreview({ ...scope(user as AuthUser), ...params, ...query });
    },
    { beforeHandle: gate, params, query: t.Object({ handoverId: UUID }) },
  )
  .post(
    '/receiver-handovers/:parcelId/signature',
    ({ params, body, user, request }) => {
      const expectedClient = body.signature.source === 'topaz' ? 'desktop' : 'mobile';
      if (readNativeClient(request) !== expectedClient)
        throw Forbidden('Capture signatures in Vipex Desktop or mobile');
      return captureReceiverHandoverSignature({ ...scope(user as AuthUser), ...params, ...body });
    },
    { beforeHandle: gate, params, body: t.Object({ handoverId: UUID, signature }) },
  )
  .post(
    '/receiver-handovers/:parcelId/confirm',
    ({ params, body, user, request }) => {
      if (readNativeClient(request) !== 'desktop')
        throw Forbidden('Confirm signed handovers in Vipex Desktop');
      return confirmSignedReceiverHandover({ ...scope(user as AuthUser), ...params, ...body });
    },
    { beforeHandle: gate, params, body: t.Object({ handoverId: UUID }) },
  );
