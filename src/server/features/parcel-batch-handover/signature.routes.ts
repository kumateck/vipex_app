import { Elysia, t } from 'elysia';
import { authPlugin, requireAnyPermissions, type AuthUser } from '@/server/plugins/auth';
import { UUID } from '@/server/schemas/common';
import { Forbidden } from '@/server/utils/http-error';
import { PermissionKeys } from '@/shared/permissions/constants';
import { MAX_HANDOVER_SIGNATURE_LENGTH } from '@/shared/shipments/handover-signature';
import { readNativeClient } from '../auth/device-headers';
import {
  captureBatchSignature,
  listBatchSignatures,
  type SignatureReader,
} from './signature-capture';

function reader(user: AuthUser): SignatureReader & { actorId: string } {
  if (!user.companyId || !user.branchId) throw Forbidden('A company and branch are required');
  const workflows: SignatureReader['workflows'] = [];
  if (user.permissions?.includes(PermissionKeys.CanCompleteOfficePickup))
    workflows.push('office-pickup');
  if (user.permissions?.includes(PermissionKeys.CanCreateReceiverPayments))
    workflows.push('receiver-cashier');
  return { companyId: user.companyId, branchId: user.branchId, actorId: user.sub, workflows };
}
const gate = requireAnyPermissions(
  PermissionKeys.CanCompleteOfficePickup,
  PermissionKeys.CanCreateReceiverPayments,
);

export const batchSignatureRoutes = new Elysia({ name: 'batch-handover-signatures' })
  .use(authPlugin)
  .get(
    '/batch-handover-signatures',
    ({ user, query, set }) => {
      set.headers['cache-control'] = 'no-store';
      return listBatchSignatures(reader(user!), query);
    },
    {
      beforeHandle: gate,
      query: t.Object({
        search: t.Optional(t.String({ maxLength: 100 })),
        after: t.Optional(UUID),
      }),
    },
  )
  .post(
    '/batch-handover-signatures/:id/signature',
    ({ user, params, body, request }) => {
      if (readNativeClient(request) !== 'mobile')
        throw Forbidden('Capture this signature in the mobile app');
      return captureBatchSignature(reader(user!), { ...params, ...body });
    },
    {
      beforeHandle: gate,
      params: t.Object({ id: UUID }),
      body: t.Object({
        requestId: UUID,
        signature: t.Object({
          source: t.Literal('touchscreen'),
          signatureImage: t.String({ minLength: 1, maxLength: MAX_HANDOVER_SIGNATURE_LENGTH }),
        }),
      }),
    },
  );
