import { Elysia, t } from 'elysia';
import { UUID } from '../../schemas/common';
import { resendSetupInviteSvc } from './service.invite-resend';
import { authPlugin, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';

export const usersInviteRoutes = new Elysia({ name: 'users-invite' }).use(authPlugin).post(
  '/auth/resend-setup/:id',
  async ({ params, body }) => {
    const res = await resendSetupInviteSvc(params.id, { force: body?.force });
    return res;
  },
  {
    params: t.Object({ id: UUID }),
    body: t.Optional(t.Object({ force: t.Optional(t.Boolean()) })),
    response: t.Object({
      ok: t.Boolean(),
      expiresAt: t.String({ format: 'date-time' }),
    }),
    beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanResendSetupInvite)],
    detail: {
      tags: ['Auth'],
      summary: 'Resend account setup email',
      description:
        'Sends a new set-password link if the user is INVITED. If an active token exists, pass force=true to invalidate and regenerate.',
      operationId: 'resendSetupInvite',
    },
  },
);
