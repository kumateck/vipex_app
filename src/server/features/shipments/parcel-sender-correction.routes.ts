import { Elysia, t } from 'elysia';
import { authPlugin, requireAuth, requirePermissions, type AuthUser } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { UUID } from '@/server/schemas/common';
import {
  correctParcelSenderSvc,
  findParcelSenderCandidatesSvc,
} from './parcel-sender-correction.service';

export function assertParcelSenderCorrectionAccess({ user }: { user: AuthUser | null }) {
  requireAuth()({ user });
  requirePermissions(PermissionKeys.CanUpdateParcels, PermissionKeys.CanUpdateCustomers)({ user });
}
const guards = [assertParcelSenderCorrectionAccess];
const context = (parcelId: string, user: AuthUser) => ({
  parcelId,
  companyId: user.companyId ?? '',
  branchId: user.branchId ?? '',
  actorUserId: user.sub,
});
export const parcelSenderCorrectionRoutes = new Elysia({ name: 'parcel-sender-correction' })
  .use(authPlugin)
  .get(
    '/:id/sender-candidates',
    ({ params, query, user }) =>
      findParcelSenderCandidatesSvc({ ...context(params.id, user!), telephone: query.telephone }),
    {
      params: t.Object({ id: UUID }),
      query: t.Object({ telephone: t.String({ pattern: '^[0-9]{10}$' }) }),
      beforeHandle: guards,
      detail: {
        tags: ['Shipments'],
        summary: 'Find an existing sender for a source-branch parcel correction',
      },
    },
  )
  .post(
    '/:id/correct-sender',
    ({ params, body, user }) => correctParcelSenderSvc({ ...context(params.id, user!), ...body }),
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        expectedSenderId: UUID,
        customerId: UUID,
        telephone: t.String({ pattern: '^[0-9]{10}$' }),
        reason: t.String({ minLength: 5, maxLength: 1000 }),
      }),
      beforeHandle: guards,
      detail: {
        tags: ['Shipments'],
        summary: 'Correct a parcel sender by linking an existing customer',
      },
    },
  );
